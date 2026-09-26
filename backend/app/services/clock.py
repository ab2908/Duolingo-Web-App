"""Time helpers.

All timestamps are stored as naive UTC. Every user carries a
``time_offset_minutes`` so testers can "time travel" (see /api/dev) and watch
streaks, heart regeneration and leaderboards react without waiting real days.
Calendar dates (streaks, daily goals, weekly leagues) use the learner's timezone.
"""
from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.models import User


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def now_for(user: User) -> datetime:
    return utcnow() + timedelta(minutes=user.time_offset_minutes or 0)


def _zone(user: User) -> ZoneInfo:
    try:
        return ZoneInfo(user.timezone or "UTC")
    except ZoneInfoNotFoundError:
        return ZoneInfo("UTC")


def local_date(user: User, moment: datetime) -> date:
    return moment.replace(tzinfo=UTC).astimezone(_zone(user)).date()


def local_datetime(user: User, moment: datetime) -> datetime:
    return moment.replace(tzinfo=UTC).astimezone(_zone(user))


def today_for(user: User) -> date:
    return local_date(user, now_for(user))


def week_start(day: date) -> date:
    """Leagues run Monday to Sunday."""
    return day - timedelta(days=day.weekday())


def is_valid_timezone(name: str) -> bool:
    try:
        ZoneInfo(name)
        return True
    except (ZoneInfoNotFoundError, ValueError):
        return False
