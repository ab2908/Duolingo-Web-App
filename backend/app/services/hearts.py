"""Heart bookkeeping.

Hearts regenerate lazily: instead of a background job, ``sync_hearts`` works
out how many regeneration intervals have elapsed since ``hearts_updated_at``
whenever the user is loaded.
"""
from datetime import datetime, timedelta

from app.config import HEART_REGEN_MINUTES, MAX_HEARTS
from app.models import User

REGEN = timedelta(minutes=HEART_REGEN_MINUTES)


def sync_hearts(user: User, now: datetime) -> None:
    if user.hearts >= MAX_HEARTS:
        user.hearts = MAX_HEARTS
        user.hearts_updated_at = now
        return
    elapsed = now - user.hearts_updated_at
    regenerated = int(elapsed / REGEN) if elapsed > timedelta(0) else 0
    if regenerated <= 0:
        return
    user.hearts = min(MAX_HEARTS, user.hearts + regenerated)
    if user.hearts >= MAX_HEARTS:
        user.hearts_updated_at = now
    else:
        user.hearts_updated_at += REGEN * regenerated


def next_heart_at(user: User) -> datetime | None:
    if user.hearts >= MAX_HEARTS:
        return None
    return user.hearts_updated_at + REGEN


def lose_heart(user: User, now: datetime) -> None:
    sync_hearts(user, now)
    if user.hearts <= 0:
        return
    if user.hearts >= MAX_HEARTS:
        # The regeneration clock starts ticking from the first heart lost.
        user.hearts_updated_at = now
    user.hearts -= 1


def gain_hearts(user: User, now: datetime, amount: int) -> None:
    sync_hearts(user, now)
    user.hearts = min(MAX_HEARTS, user.hearts + amount)
    if user.hearts >= MAX_HEARTS:
        user.hearts_updated_at = now


def refill_hearts(user: User, now: datetime) -> None:
    user.hearts = MAX_HEARTS
    user.hearts_updated_at = now
