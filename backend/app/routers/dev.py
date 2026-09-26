"""Testing helpers: simulate the passage of time and reset demo data.

Streaks, heart regeneration and weekly leagues depend on real days passing;
these endpoints make that logic demonstrable in a few clicks.
"""
from fastapi import APIRouter

from app.database import engine
from app.deps import CurrentUser, DbSession
from app.schemas import Me, TimeTravelIn
from app.seed.seed import reset_database
from app.services.users import me_view

router = APIRouter(prefix="/api/dev", tags=["dev tools"])


@router.post("/time-travel", response_model=Me)
def time_travel(body: TimeTravelIn, db: DbSession, user: CurrentUser):
    """Move this learner's clock forward. Settling happens on the next request."""
    user.time_offset_minutes += body.hours * 60
    db.commit()
    return me_view(db, user)


@router.post("/reset", status_code=204)
def reset(db: DbSession):
    """Drop everything and re-seed the demo course, learner and rivals."""
    db.close()
    reset_database(engine)
