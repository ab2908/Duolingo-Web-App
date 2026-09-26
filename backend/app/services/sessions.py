"""The lesson loop: start a session, grade answers, finish and reward.

Modes
-----
lesson     next lesson of a skill; wrong answers cost hearts. At 0 hearts answering
           is blocked until the learner refills (or quits, which fails the lesson).
practice   mixed review of finished material; no hearts lost, earns +1 heart.
legendary  every lesson of a finished skill, 3 mistakes or the timer = failed.
"""
import json
import random
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app import config
from app.errors import ApiError
from app.models import (
    Exercise,
    Lesson,
    LessonSession,
    SessionAnswer,
    SessionExercise,
    Skill,
    User,
    UserSkillProgress,
    XpEvent,
)
from app.services import achievements, hearts, progress, stats, streak
from app.services.clock import local_date, now_for
from app.services.grading import InvalidAnswer, grade

PRACTICE_SIZE = 8
LEGENDARY_SIZE = 12


# ---------------------------------------------------------------------------
# Start
# ---------------------------------------------------------------------------


def _load_skill(db: Session, skill_id: int) -> Skill:
    skill = db.get(Skill, skill_id)
    if skill is None:
        raise ApiError(404, "skill_not_found", "Skill not found")
    return skill


def _exercises_of(lessons: list[Lesson]) -> list[Exercise]:
    return [e for lesson in lessons for e in lesson.exercises]


def _sample(exercises: list[Exercise], size: int, rng: random.Random) -> list[Exercise]:
    """Pick up to ``size`` exercises, spreading the picks across exercise types."""
    by_type: dict[str, list[Exercise]] = {}
    for e in exercises:
        by_type.setdefault(e.type, []).append(e)
    for bucket in by_type.values():
        rng.shuffle(bucket)
    picked: list[Exercise] = []
    while len(picked) < size and any(by_type.values()):
        for bucket in list(by_type.values()):
            if bucket and len(picked) < size:
                picked.append(bucket.pop())
    rng.shuffle(picked)
    return picked


def start_session(db: Session, user: User, skill_id: int | None, mode: str) -> LessonSession:
    now = now_for(user)
    rng = random.Random()
    lesson: Lesson | None = None
    skill: Skill | None = None

    if mode == "lesson":
        if skill_id is None:
            raise ApiError(422, "skill_required", "A skill is required to start a lesson")
        skill = _load_skill(db, skill_id)
        if skill.kind == "chest":
            raise ApiError(400, "not_a_lesson", "Chests are opened, not played")
        state = progress.skill_state(db, user, skill)
        if state == "locked":
            raise ApiError(403, "skill_locked", "Complete all levels above to unlock this")
        if user.hearts <= 0:
            raise ApiError(403, "out_of_hearts", "You ran out of hearts")
        row = progress.progress_by_skill(db, user).get(skill.id)
        lesson = progress.next_lesson(skill, row)
        exercises = list(lesson.exercises)

    elif mode == "practice":
        pool: list[Exercise] = []
        if skill_id is not None:
            skill = _load_skill(db, skill_id)
            row = progress.progress_by_skill(db, user).get(skill.id)
            done = row.lessons_completed if row else 0
            pool = _exercises_of(skill.lessons[: max(done, 0)])
        if not pool:
            pool = _practice_pool(db, user)
        if not pool:
            raise ApiError(400, "nothing_to_practice", "Finish a lesson first to unlock practice")
        exercises = _sample(pool, PRACTICE_SIZE, rng)

    elif mode == "legendary":
        if skill_id is None:
            raise ApiError(422, "skill_required", "A skill is required for a legendary challenge")
        skill = _load_skill(db, skill_id)
        if skill.kind != "skill" or progress.skill_state(db, user, skill) != "completed":
            raise ApiError(403, "not_eligible", "Complete this skill to unlock its legendary challenge")
        exercises = _sample(_exercises_of(skill.lessons), LEGENDARY_SIZE, rng)

    else:
        raise ApiError(422, "invalid_mode", f"Unknown mode {mode}")

    if not user.listening_enabled:
        exercises = [e for e in exercises if e.type != "listen"] or exercises

    # Abandon any dangling session so only one is active at a time.
    for stale in db.scalars(
        select(LessonSession).where(LessonSession.user_id == user.id, LessonSession.status == "in_progress")
    ):
        stale.status = "abandoned"
        stale.finished_at = now

    session = LessonSession(
        user_id=user.id,
        skill_id=skill.id if skill else None,
        lesson_id=lesson.id if lesson else None,
        mode=mode,
        status="in_progress",
        started_at=now,
    )
    session.exercises = [SessionExercise(exercise_id=e.id, position=i) for i, e in enumerate(exercises)]
    db.add(session)
    db.flush()
    return session


def _practice_pool(db: Session, user: User) -> list[Exercise]:
    rows = db.scalars(
        select(UserSkillProgress)
        .where(UserSkillProgress.user_id == user.id, UserSkillProgress.lessons_completed > 0)
        .options(selectinload(UserSkillProgress.skill).selectinload(Skill.lessons))
    )
    pool: list[Exercise] = []
    for row in rows:
        pool.extend(_exercises_of(row.skill.lessons[: row.lessons_completed]))
    return pool


# ---------------------------------------------------------------------------
# Serialisation
# ---------------------------------------------------------------------------


def serialize_exercise(exercise: Exercise, seed: int) -> dict:
    """Client view of an exercise: no solution, no ``is_correct`` flags."""
    options = list(exercise.options)
    rng = random.Random(seed * 7919 + exercise.id)
    if exercise.type in ("translate", "listen", "multiple_choice", "fill_blank"):
        rng.shuffle(options)
    elif exercise.type == "match_pairs":
        left = [o for o in options if o.side == "left"]
        right = [o for o in options if o.side == "right"]
        rng.shuffle(left)
        rng.shuffle(right)
        options = left + right
    return {
        "id": exercise.id,
        "type": exercise.type,
        "instruction": exercise.instruction,
        "prompt": exercise.prompt,
        "hint": exercise.hint,
        "prompt_language": exercise.prompt_language,
        "answer_language": exercise.answer_language,
        "options": [
            {
                "id": o.id,
                "text": o.text,
                "image": o.image,
                "side": o.side,
                # Match pairs are checked instantly in the UI, so the pairing is public.
                "pair_key": o.pair_key if exercise.type == "match_pairs" else None,
            }
            for o in options
        ],
    }


def serialize_session(session: LessonSession, user: User) -> dict:
    return {
        "id": session.id,
        "mode": session.mode,
        "skill_id": session.skill_id,
        "lesson_id": session.lesson_id,
        "title": session.skill.title if session.skill else "Practice",
        "hearts": user.hearts,
        "max_mistakes": config.LEGENDARY_MAX_MISTAKES if session.mode == "legendary" else None,
        "time_limit_seconds": config.LEGENDARY_TIME_LIMIT_SECONDS if session.mode == "legendary" else None,
        "uses_hearts": session.mode == "lesson",
        "exercises": [serialize_exercise(se.exercise, session.id) for se in session.exercises],
    }


# ---------------------------------------------------------------------------
# Answer
# ---------------------------------------------------------------------------


def _load_active(db: Session, user: User, session_id: int) -> LessonSession:
    session = db.get(LessonSession, session_id)
    if session is None or session.user_id != user.id:
        raise ApiError(404, "session_not_found", "Session not found")
    if session.status != "in_progress":
        raise ApiError(409, "session_closed", f"This session is already {session.status}")
    return session


def submit_answer(db: Session, user: User, session_id: int, exercise_id: int, answer: object) -> dict:
    session = _load_active(db, user, session_id)
    now = now_for(user)
    if session.mode == "lesson" and user.hearts <= 0:
        # The session stays open so the learner can refill hearts and carry on.
        raise ApiError(403, "out_of_hearts", "You ran out of hearts")
    link = next((se for se in session.exercises if se.exercise_id == exercise_id), None)
    if link is None:
        raise ApiError(400, "exercise_not_in_session", "This exercise is not part of the session")

    try:
        result = grade(link.exercise, answer)
    except InvalidAnswer as exc:
        raise ApiError(422, "invalid_answer", str(exc)) from exc

    db.add(SessionAnswer(session_id=session.id, exercise_id=exercise_id, answer=json.dumps(answer),
                         is_correct=result.correct, answered_at=now))

    if not result.correct:
        session.mistakes += 1
        if session.mode == "lesson":
            hearts.lose_heart(user, now)
            session.hearts_lost += 1
        elif session.mode == "legendary" and session.mistakes >= config.LEGENDARY_MAX_MISTAKES:
            session.status = "failed"
            session.finished_at = now
    db.flush()

    return {
        "correct": result.correct,
        "solution": result.solution,
        "note": result.note,
        "hearts": user.hearts,
        "mistakes": session.mistakes,
        "session_status": session.status,
    }


def skip_listening(db: Session, user: User, session_id: int, exercise_id: int) -> None:
    """Handle "Can't listen now": pass a listening exercise without penalty and turn
    listening exercises off for future sessions (re-enable in Settings)."""
    session = _load_active(db, user, session_id)
    link = next((se for se in session.exercises if se.exercise_id == exercise_id), None)
    if link is None or link.exercise.type != "listen":
        raise ApiError(400, "not_a_listening_exercise", "Only listening exercises can be skipped this way")
    db.add(SessionAnswer(session_id=session.id, exercise_id=exercise_id, answer=json.dumps("skipped: can't listen now"),
                         is_correct=True, answered_at=now_for(user)))
    user.listening_enabled = False
    db.flush()


# ---------------------------------------------------------------------------
# Complete
# ---------------------------------------------------------------------------


def _accuracy(session: LessonSession) -> int:
    """Share of exercises answered correctly on the first attempt."""
    first: dict[int, bool] = {}
    for ans in sorted(session.answers, key=lambda a: a.id):
        first.setdefault(ans.exercise_id, ans.is_correct)
    total = len(session.exercises) or 1
    return round(100 * sum(1 for ok in first.values() if ok) / total)


def complete_session(db: Session, user: User, session_id: int) -> dict:
    session = _load_active(db, user, session_id)
    now = now_for(user)

    solved = {a.exercise_id for a in session.answers if a.is_correct}
    missing = [se.exercise_id for se in session.exercises if se.exercise_id not in solved]
    if missing:
        raise ApiError(400, "lesson_incomplete", "Every exercise must be answered correctly first")

    if session.mode == "legendary":
        grace = timedelta(seconds=config.LEGENDARY_TIME_LIMIT_SECONDS + 15)
        if now - session.started_at > grace:
            session.status = "failed"
            session.finished_at = now
            db.flush()
            raise ApiError(409, "time_up", "Time's up! The legendary challenge has ended")

    skill = db.get(Skill, session.skill_id) if session.skill_id else None
    lesson = db.get(Lesson, session.lesson_id) if session.lesson_id else None
    today = local_date(user, now)
    xp_before = stats.xp_on(db, user, today)
    level_before = None
    skill_row = None

    # --- XP ---------------------------------------------------------------
    if session.mode == "lesson":
        base = config.REVIEW_XP if skill and skill.kind == "review" else config.LESSON_XP
        bonus = config.PERFECT_LESSON_BONUS_XP if session.mistakes == 0 else 0
    elif session.mode == "practice":
        base, bonus = config.PRACTICE_XP, 0
    else:
        base, bonus = config.LEGENDARY_XP, 0
    xp = base + bonus

    session.status = "completed"
    session.finished_at = now
    session.xp_earned = xp
    session.accuracy = _accuracy(session)
    db.add(XpEvent(user_id=user.id, session_id=session.id, amount=xp, source=session.mode,
                   activity_date=today, created_at=now))
    user.total_xp += xp

    # --- Progress ---------------------------------------------------------
    hearts_gained = 0
    if session.mode == "lesson" and lesson is not None:
        existing = progress.progress_by_skill(db, user).get(lesson.skill_id)
        level_before = existing.lessons_completed if existing else 0
        skill_row = progress.complete_lesson(db, user, lesson, now)
    elif session.mode == "practice":
        before = user.hearts
        hearts.gain_hearts(user, now, 1)
        hearts_gained = user.hearts - before
        if skill is not None:
            skill_row = progress.get_or_create_progress(db, user, skill)
            skill_row.practice_count += 1
    elif session.mode == "legendary" and skill is not None:
        skill_row = progress.get_or_create_progress(db, user, skill)
        skill_row.is_legendary = True

    # --- Streak, goal, achievements ---------------------------------------
    streak_extended = streak.record_activity(user, today)
    db.flush()
    xp_after = xp_before + xp
    new_achievements = achievements.evaluate(db, user)
    db.flush()

    duration = int((now - session.started_at).total_seconds())
    return {
        "session_id": session.id,
        "mode": session.mode,
        "xp_earned": xp,
        "base_xp": base,
        "bonus_xp": bonus,
        "accuracy": session.accuracy,
        "mistakes": session.mistakes,
        "duration_seconds": max(duration, 1),
        "hearts": user.hearts,
        "hearts_gained": hearts_gained,
        "total_xp": user.total_xp,
        "streak": {
            "count": user.streak_count,
            "extended": streak_extended,
            "week": stats.streak_week(db, user),
        },
        "daily_goal": {
            "goal": user.daily_goal_xp,
            "xp_today": xp_after,
            "just_completed": xp_before < user.daily_goal_xp <= xp_after,
        },
        "skill": None
        if skill_row is None or skill is None
        else {
            "id": skill.id,
            "title": skill.title,
            "lessons_completed": skill_row.lessons_completed,
            "total_lessons": len(skill.lessons),
            "completed": skill_row.completed_at is not None,
            "level_up": level_before is not None and skill_row.lessons_completed > level_before,
            "is_legendary": skill_row.is_legendary,
        },
        "new_achievements": new_achievements,
    }


def abandon_session(db: Session, user: User, session_id: int) -> None:
    session = db.get(LessonSession, session_id)
    if session is None or session.user_id != user.id:
        raise ApiError(404, "session_not_found", "Session not found")
    if session.status == "in_progress":
        out_of_hearts = session.mode == "lesson" and user.hearts <= 0
        session.status = "failed" if out_of_hearts else "abandoned"
        session.finished_at = now_for(user)
