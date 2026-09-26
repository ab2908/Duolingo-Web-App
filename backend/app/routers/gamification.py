from fastapi import APIRouter

from app import config
from app.deps import CurrentUser, DbSession
from app.errors import ApiError
from app.models import GemTransaction
from app.schemas import Leaderboard, Me, PurchaseIn, Quest, Shop
from app.services import hearts, stats
from app.services.clock import now_for
from app.services.users import me_view

router = APIRouter(prefix="/api", tags=["gamification"])


@router.get("/leaderboard", response_model=Leaderboard)
def get_leaderboard(db: DbSession, user: CurrentUser):
    board = stats.leaderboard(db, user)
    db.commit()  # persists simulated rival XP
    return board


@router.get("/quests", response_model=list[Quest])
def get_quests(db: DbSession, user: CurrentUser):
    return stats.daily_quests(db, user)


@router.get("/shop", response_model=Shop)
def get_shop(user: CurrentUser):
    full = user.hearts >= config.MAX_HEARTS
    freezes_maxed = user.streak_freezes >= config.MAX_STREAK_FREEZES
    return {
        "gems": user.gems,
        "items": [
            {
                "code": "heart_refill",
                "title": "Refill Hearts",
                "description": "Get full hearts so you can worry less about making mistakes in a lesson",
                "price": config.HEART_REFILL_COST_GEMS,
                "available": not full,
                "reason": "Full" if full else None,
            },
            {
                "code": "streak_freeze",
                "title": "Streak Freeze",
                "description": "Streak Freeze allows your streak to remain in place for one full day of inactivity.",
                "price": config.STREAK_FREEZE_COST_GEMS,
                "available": not freezes_maxed,
                "owned": user.streak_freezes,
                "reason": f"{user.streak_freezes} / {config.MAX_STREAK_FREEZES} equipped" if freezes_maxed else None,
            },
        ],
    }


@router.post("/shop/purchase", response_model=Me)
def purchase(body: PurchaseIn, db: DbSession, user: CurrentUser):
    now = now_for(user)
    if body.item == "heart_refill":
        price = config.HEART_REFILL_COST_GEMS
        if user.hearts >= config.MAX_HEARTS:
            raise ApiError(409, "hearts_full", "Your hearts are already full")
    else:
        price = config.STREAK_FREEZE_COST_GEMS
        if user.streak_freezes >= config.MAX_STREAK_FREEZES:
            raise ApiError(409, "max_freezes", "You already have the maximum number of streak freezes")
    if user.gems < price:
        raise ApiError(402, "not_enough_gems", "You don't have enough gems")

    user.gems -= price
    db.add(GemTransaction(user_id=user.id, amount=-price, reason=body.item, created_at=now))
    if body.item == "heart_refill":
        hearts.refill_hearts(user, now)
    else:
        user.streak_freezes += 1
    db.commit()
    return me_view(db, user)
