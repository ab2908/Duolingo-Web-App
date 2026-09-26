import os
import tempfile
from pathlib import Path

import pytest

_DB = Path(tempfile.gettempdir()) / "duolingo_clone_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{_DB}"

from fastapi.testclient import TestClient  # noqa: E402

from app.database import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Exercise  # noqa: E402
from app.seed.seed import reset_database  # noqa: E402


@pytest.fixture()
def client():
    reset_database(engine)
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def db():
    session = SessionLocal()
    yield session
    session.close()


def correct_answer(exercise_id: int):
    """Build the right answer payload for any exercise, straight from the DB."""
    with SessionLocal() as s:
        ex = s.get(Exercise, exercise_id)
        opts = list(ex.options)
        if ex.type in ("multiple_choice", "fill_blank"):
            return next(o.id for o in opts if o.is_correct)
        if ex.type in ("translate", "listen"):
            remaining = list(opts)
            ids = []
            from app.seed.builder import tokens

            for word in tokens(ex.solution):
                match = next(o for o in remaining if o.text == word)
                remaining.remove(match)
                ids.append(match.id)
            return ids
        if ex.type == "match_pairs":
            left = [o for o in opts if o.side == "left"]
            right = {o.pair_key: o.id for o in opts if o.side == "right"}
            return [[o.id, right[o.pair_key]] for o in left]
        return ex.solution


def wrong_answer(exercise_id: int):
    with SessionLocal() as s:
        ex = s.get(Exercise, exercise_id)
        if ex.type in ("multiple_choice", "fill_blank"):
            return next(o.id for o in ex.options if not o.is_correct)
        if ex.type in ("translate", "listen"):
            return [ex.options[-1].id]
        if ex.type == "match_pairs":
            left = [o for o in ex.options if o.side == "left"]
            right = [o for o in ex.options if o.side == "right"]
            return [[left[0].id, next(r.id for r in right if r.pair_key != left[0].pair_key)]]
        return "definitely wrong"


def play(client, session: dict, mistakes: int = 0) -> list[dict]:
    """Answer every exercise (making ``mistakes`` wrong attempts first)."""
    results = []
    for i, ex in enumerate(session["exercises"]):
        if i < mistakes:
            results.append(client.post(f"/api/sessions/{session['id']}/answers",
                                       json={"exercise_id": ex["id"], "answer": wrong_answer(ex["id"])}).json())
            if results[-1]["session_status"] != "in_progress":
                return results
        results.append(client.post(f"/api/sessions/{session['id']}/answers",
                                   json={"exercise_id": ex["id"], "answer": correct_answer(ex["id"])}).json())
    return results
