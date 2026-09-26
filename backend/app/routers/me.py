from fastapi import APIRouter

from app import config
from app.deps import CurrentUser, DbSession
from app.errors import ApiError
from app.schemas import Me, Profile, SettingsUpdate
from app.services.clock import is_valid_timezone
from app.services.users import me_view, profile_view

router = APIRouter(prefix="/api", tags=["learner"])


@router.get("/me", response_model=Me)
def get_me(db: DbSession, user: CurrentUser):
    return me_view(db, user)


@router.patch("/me/settings", response_model=Me)
def update_settings(body: SettingsUpdate, db: DbSession, user: CurrentUser):
    if body.daily_goal_xp is not None:
        if body.daily_goal_xp not in config.DAILY_GOAL_OPTIONS:
            raise ApiError(422, "invalid_goal", f"Daily goal must be one of {config.DAILY_GOAL_OPTIONS}")
        user.daily_goal_xp = body.daily_goal_xp
    if body.timezone is not None:
        if not is_valid_timezone(body.timezone):
            raise ApiError(422, "invalid_timezone", "Unknown timezone")
        user.timezone = body.timezone
    if body.display_name is not None:
        user.display_name = body.display_name.strip()
    if body.sound_enabled is not None:
        user.sound_enabled = body.sound_enabled
    if body.listening_enabled is not None:
        user.listening_enabled = body.listening_enabled
    db.commit()
    return me_view(db, user)


@router.get("/profile", response_model=Profile)
def get_profile(db: DbSession, user: CurrentUser):
    return profile_view(db, user)
