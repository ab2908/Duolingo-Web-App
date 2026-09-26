from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.config import DEFAULT_USER_ID
from app.database import get_db
from app.errors import ApiError
from app.models import User
from app.services import hearts, streak
from app.services.clock import now_for, today_for

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(db: DbSession, x_user_id: Annotated[int | None, Header()] = None) -> User:
    """Authentication is out of scope: the default learner is always logged in.

    ``X-User-Id`` lets tests act as another learner. Every request settles the
    lazily computed state (heart regeneration, missed streak days) first.
    """
    user = db.get(User, x_user_id or DEFAULT_USER_ID)
    if user is None or user.is_bot:
        raise ApiError(404, "user_not_found", "Learner not found")
    hearts.sync_hearts(user, now_for(user))
    streak.settle_streak(user, today_for(user))
    db.commit()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
