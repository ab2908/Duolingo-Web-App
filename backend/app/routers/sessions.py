from fastapi import APIRouter, status

from app.deps import CurrentUser, DbSession
from app.schemas import AnswerIn, AnswerResult, SessionOut, SessionSummary, SkipListeningIn, StartSession
from app.services import sessions

router = APIRouter(prefix="/api/sessions", tags=["lesson loop"])


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def start(body: StartSession, db: DbSession, user: CurrentUser):
    """Start a lesson, practice or legendary session and return its exercises."""
    session = sessions.start_session(db, user, body.skill_id, body.mode)
    db.commit()
    return sessions.serialize_session(session, user)


@router.post("/{session_id}/answers", response_model=AnswerResult)
def answer(session_id: int, body: AnswerIn, db: DbSession, user: CurrentUser):
    """Grade one answer. Wrong answers cost a heart in lesson mode."""
    result = sessions.submit_answer(db, user, session_id, body.exercise_id, body.answer)
    db.commit()
    return result


@router.post("/{session_id}/skip-listening", status_code=status.HTTP_204_NO_CONTENT)
def skip_listening(session_id: int, body: SkipListeningIn, db: DbSession, user: CurrentUser):
    """Handle "Can't listen now": pass a listening exercise without losing a heart."""
    sessions.skip_listening(db, user, session_id, body.exercise_id)
    db.commit()


@router.post("/{session_id}/complete", response_model=SessionSummary)
def complete(session_id: int, db: DbSession, user: CurrentUser):
    """Finish the session: award XP, update skill progress, streak and achievements."""
    summary = sessions.complete_session(db, user, session_id)
    db.commit()
    return summary


@router.post("/{session_id}/abandon", status_code=status.HTTP_204_NO_CONTENT)
def abandon(session_id: int, db: DbSession, user: CurrentUser):
    sessions.abandon_session(db, user, session_id)
    db.commit()
