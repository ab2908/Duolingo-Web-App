from fastapi import APIRouter

from app import config
from app.deps import CurrentUser, DbSession
from app.errors import ApiError
from app.models import GemTransaction, Skill, Unit
from app.schemas import ChestResult, Guidebook, LearningPath
from app.services import progress
from app.services.clock import now_for

router = APIRouter(prefix="/api", tags=["course"])


@router.get("/path", response_model=LearningPath)
def get_path(db: DbSession, user: CurrentUser):
    return progress.build_path(db, user)


@router.get("/units/{unit_id}/guidebook", response_model=Guidebook)
def get_guidebook(unit_id: int, db: DbSession, _user: CurrentUser):
    unit = db.get(Unit, unit_id)
    if unit is None:
        raise ApiError(404, "unit_not_found", "Unit not found")
    return {"unit_id": unit.id, "title": unit.title, "description": unit.description,
            "color": unit.color, "content": unit.guidebook}


@router.post("/skills/{skill_id}/chest", response_model=ChestResult)
def open_chest(skill_id: int, db: DbSession, user: CurrentUser):
    skill = db.get(Skill, skill_id)
    if skill is None or skill.kind != "chest":
        raise ApiError(404, "chest_not_found", "Chest not found")
    state = progress.skill_state(db, user, skill)
    if state == "locked":
        raise ApiError(403, "skill_locked", "Keep going to reach this chest")
    if state == "completed":
        raise ApiError(409, "already_opened", "This chest is already open")

    now = now_for(user)
    row = progress.get_or_create_progress(db, user, skill)
    row.completed_at = now
    user.gems += config.CHEST_GEMS
    db.add(GemTransaction(user_id=user.id, amount=config.CHEST_GEMS, reason="chest", created_at=now))
    db.commit()
    return {"gems_awarded": config.CHEST_GEMS, "gems": user.gems}
