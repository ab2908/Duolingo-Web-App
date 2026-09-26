"""End-to-end tests of the lesson loop and gamification through the HTTP API."""
from conftest import correct_answer, play, wrong_answer


def active_skill(client) -> int:
    return client.get("/api/path").json()["active_skill_id"]


def test_path_has_completed_active_and_locked_nodes(client):
    path = client.get("/api/path").json()
    states = [s["state"] for u in path["units"] for s in u["skills"]]
    assert states.count("active") == 1
    assert states.index("active") > 0
    assert all(s == "locked" for s in states[states.index("active") + 1:])


def test_exercises_never_leak_solutions(client):
    session = client.post("/api/sessions", json={"skill_id": active_skill(client)}).json()
    for ex in session["exercises"]:
        assert "solution" not in ex
        assert all("is_correct" not in o for o in ex["options"])


def test_locked_skill_cannot_be_started(client):
    path = client.get("/api/path").json()
    locked = next(s["id"] for u in path["units"] for s in u["skills"] if s["state"] == "locked")
    res = client.post("/api/sessions", json={"skill_id": locked})
    assert res.status_code == 403 and res.json()["code"] == "skill_locked"


def test_full_lesson_awards_xp_progress_and_streak(client):
    me = client.get("/api/me").json()
    skill_id = active_skill(client)
    session = client.post("/api/sessions", json={"skill_id": skill_id}).json()
    assert all(r["correct"] for r in play(client, session))

    summary = client.post(f"/api/sessions/{session['id']}/complete").json()
    assert summary["xp_earned"] == 15  # 10 + perfect bonus
    assert summary["accuracy"] == 100
    assert summary["streak"]["extended"] is True
    assert summary["streak"]["count"] == me["streak"] + 1
    assert summary["skill"]["lessons_completed"] == 2 and summary["skill"]["level_up"]

    after = client.get("/api/me").json()
    assert after["total_xp"] == me["total_xp"] + 15
    assert after["xp_today"] == 15
    assert after["streak_extended_today"] is True


def test_wrong_answers_cost_hearts_and_retry_is_required(client):
    session = client.post("/api/sessions", json={"skill_id": active_skill(client)}).json()
    first = session["exercises"][0]
    hearts = session["hearts"]
    wrong = client.post(f"/api/sessions/{session['id']}/answers",
                        json={"exercise_id": first["id"], "answer": "nope"})
    assert wrong.status_code == 422  # malformed answers are rejected, not graded

    res = client.post(f"/api/sessions/{session['id']}/answers",
                      json={"exercise_id": first["id"], "answer": wrong_answer(first["id"])}).json()
    assert res["correct"] is False and res["hearts"] == hearts - 1 and res["solution"]

    incomplete = client.post(f"/api/sessions/{session['id']}/complete")
    assert incomplete.status_code == 400

    play(client, session)
    summary = client.post(f"/api/sessions/{session['id']}/complete").json()
    assert summary["xp_earned"] == 10 and summary["mistakes"] == 1


def test_running_out_of_hearts_fails_the_lesson(client):
    session = client.post("/api/sessions", json={"skill_id": active_skill(client)}).json()
    ex = session["exercises"]
    for e in ex[:4]:
        res = client.post(f"/api/sessions/{session['id']}/answers",
                          json={"exercise_id": e["id"], "answer": wrong_answer(e["id"])}).json()
    assert res["hearts"] == 0 and res["session_status"] == "in_progress"

    blocked_answer = client.post(f"/api/sessions/{session['id']}/answers",
                                 json={"exercise_id": ex[5]["id"], "answer": correct_answer(ex[5]["id"])})
    assert blocked_answer.status_code == 403 and blocked_answer.json()["code"] == "out_of_hearts"

    blocked = client.post("/api/sessions", json={"skill_id": active_skill(client)})
    assert blocked.status_code == 403 and blocked.json()["code"] == "out_of_hearts"


def test_refilling_mid_lesson_lets_the_learner_continue(client):
    session = client.post("/api/sessions", json={"skill_id": active_skill(client)}).json()
    for e in session["exercises"][:4]:
        client.post(f"/api/sessions/{session['id']}/answers",
                    json={"exercise_id": e["id"], "answer": wrong_answer(e["id"])})
    assert client.post("/api/shop/purchase", json={"item": "heart_refill"}).json()["hearts"] == 5
    play(client, session)
    summary = client.post(f"/api/sessions/{session['id']}/complete")
    assert summary.status_code == 200 and summary.json()["mistakes"] == 4


def test_quitting_with_no_hearts_fails_the_lesson(client, db):
    from app.models import LessonSession
    session = client.post("/api/sessions", json={"skill_id": active_skill(client)}).json()
    for e in session["exercises"][:4]:
        client.post(f"/api/sessions/{session['id']}/answers",
                    json={"exercise_id": e["id"], "answer": wrong_answer(e["id"])})
    assert client.post(f"/api/sessions/{session['id']}/abandon").status_code == 204
    assert db.get(LessonSession, session["id"]).status == "failed"


def test_practice_restores_a_heart_and_refill_costs_gems(client):
    session = client.post("/api/sessions", json={"skill_id": active_skill(client)}).json()
    for e in session["exercises"][:4]:  # the demo learner starts with 4 hearts
        client.post(f"/api/sessions/{session['id']}/answers",
                    json={"exercise_id": e["id"], "answer": wrong_answer(e["id"])})
    assert client.get("/api/me").json()["hearts"] == 0

    practice = client.post("/api/sessions", json={"mode": "practice"}).json()
    assert practice["uses_hearts"] is False
    play(client, practice)
    summary = client.post(f"/api/sessions/{practice['id']}/complete").json()
    assert summary["hearts"] == 1 and summary["hearts_gained"] == 1

    gems = client.get("/api/me").json()["gems"]
    me = client.post("/api/shop/purchase", json={"item": "heart_refill"}).json()
    assert me["hearts"] == 5 and me["gems"] == gems - me["refill_cost"]
    again = client.post("/api/shop/purchase", json={"item": "heart_refill"})
    assert again.status_code == 409


def test_finishing_all_lessons_unlocks_the_next_node(client):
    skill_id = active_skill(client)
    while True:
        session = client.post("/api/sessions", json={"skill_id": skill_id}).json()
        play(client, session)
        summary = client.post(f"/api/sessions/{session['id']}/complete").json()
        if summary["skill"]["completed"]:
            break
    path = client.get("/api/path").json()
    nodes = [s for u in path["units"] for s in u["skills"]]
    idx = next(i for i, s in enumerate(nodes) if s["id"] == skill_id)
    assert nodes[idx]["state"] == "completed"
    assert nodes[idx + 1]["state"] == "active"

    legendary = client.post("/api/sessions", json={"skill_id": skill_id, "mode": "legendary"})
    assert legendary.status_code == 201 and legendary.json()["max_mistakes"] == 3


def test_chest_can_be_opened_once_when_reached(client):
    path = client.get("/api/path").json()
    chest = next(s for u in path["units"] for s in u["skills"] if s["kind"] == "chest")
    assert chest["state"] == "completed"  # the demo learner already opened the first one
    assert client.post(f"/api/skills/{chest['id']}/chest").status_code == 409


def test_time_travel_breaks_streak_without_freezes(client):
    me = client.get("/api/me").json()
    assert me["streak"] > 0 and me["streak_freezes"] == 1
    # Last practice was yesterday: skipping today (one missed day) uses the freeze.
    client.post("/api/dev/time-travel", json={"hours": 24})
    saved = client.get("/api/me").json()
    assert saved["streak"] == me["streak"] and saved["streak_freezes"] == 0
    client.post("/api/dev/time-travel", json={"hours": 48})  # misses another day, no freeze left
    assert client.get("/api/me").json()["streak"] == 0


def test_hearts_regenerate_over_simulated_time(client):
    me = client.get("/api/me").json()
    assert me["hearts"] == 4
    client.post("/api/dev/time-travel", json={"hours": 5})
    assert client.get("/api/me").json()["hearts"] == 5


def test_leaderboard_ranks_learner_among_rivals(client):
    board = client.get("/api/leaderboard").json()
    assert len(board["entries"]) == 15
    assert sum(e["is_me"] for e in board["entries"]) == 1
    xp = [e["weekly_xp"] for e in board["entries"]]
    assert xp == sorted(xp, reverse=True)
    # Earning XP moves the learner up the table.
    session = client.post("/api/sessions", json={"skill_id": active_skill(client)}).json()
    play(client, session)
    client.post(f"/api/sessions/{session['id']}/complete")
    after = next(e for e in client.get("/api/leaderboard").json()["entries"] if e["is_me"])
    before = next(e for e in board["entries"] if e["is_me"])
    assert after["weekly_xp"] == before["weekly_xp"] + 15


def test_settings_validation(client):
    assert client.patch("/api/me/settings", json={"daily_goal_xp": 30}).json()["daily_goal_xp"] == 30
    assert client.patch("/api/me/settings", json={"daily_goal_xp": 33}).status_code == 422
    assert client.patch("/api/me/settings", json={"timezone": "Asia/Kolkata"}).json()["timezone"] == "Asia/Kolkata"
    assert client.patch("/api/me/settings", json={"timezone": "Mars/Base"}).status_code == 422


def test_correct_answer_helper_matches_grader(client):
    """Sanity check that every seeded exercise is solvable."""
    path = client.get("/api/path").json()
    session = client.post("/api/sessions", json={"skill_id": path["active_skill_id"]}).json()
    for ex in session["exercises"]:
        res = client.post(f"/api/sessions/{session['id']}/answers",
                          json={"exercise_id": ex["id"], "answer": correct_answer(ex["id"])}).json()
        assert res["correct"], ex


def test_every_seeded_exercise_is_solvable(client, db):
    from app.models import Exercise
    from app.services.grading import grade

    exercises = db.query(Exercise).all()
    assert len(exercises) > 300
    for ex in exercises:
        assert grade(ex, correct_answer(ex.id)).correct, (ex.id, ex.type, ex.solution)


def test_skip_counts_as_a_mistake(client):
    session = client.post("/api/sessions", json={"skill_id": active_skill(client)}).json()
    ex = session["exercises"][1]
    res = client.post(f"/api/sessions/{session['id']}/answers", json={"exercise_id": ex["id"], "answer": None}).json()
    assert res["correct"] is False and res["hearts"] == session["hearts"] - 1


def test_cant_listen_now_skips_without_penalty_and_disables_listening(client):
    session = client.post("/api/sessions", json={"skill_id": active_skill(client)}).json()
    listen = next(e for e in session["exercises"] if e["type"] == "listen")
    other = next(e for e in session["exercises"] if e["type"] != "listen")
    bad = client.post(f"/api/sessions/{session['id']}/skip-listening", json={"exercise_id": other["id"]})
    assert bad.status_code == 400
    ok = client.post(f"/api/sessions/{session['id']}/skip-listening", json={"exercise_id": listen["id"]})
    assert ok.status_code == 204
    assert client.get("/api/me").json()["listening_enabled"] is False
    assert client.get("/api/me").json()["hearts"] == session["hearts"]
    for e in session["exercises"]:
        if e["type"] != "listen":
            client.post(f"/api/sessions/{session['id']}/answers", json={"exercise_id": e["id"], "answer": correct_answer(e["id"])})
    assert client.post(f"/api/sessions/{session['id']}/complete").status_code == 200
    nxt = client.post("/api/sessions", json={"skill_id": active_skill(client)}).json()
    assert all(e["type"] != "listen" for e in nxt["exercises"])
