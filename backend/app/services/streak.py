"""Daily streak rules.

* Completing any lesson/practice on a new calendar day extends the streak.
* Missing a day breaks it, unless streak freezes are equipped: one freeze is
  consumed per missed day and the streak survives (without growing).

``settle_streak`` is idempotent and is applied whenever the user is loaded, so
the stored streak is always correct for "today" (including simulated days).
"""
from datetime import date, timedelta

from app.models import User


def settle_streak(user: User, today: date) -> int:
    """Apply missed days to the streak. Returns the number of freezes consumed."""
    if user.last_streak_date is None or user.streak_count == 0:
        return 0
    missed = (today - user.last_streak_date).days - 1
    if missed <= 0:
        return 0
    if user.streak_freezes >= missed:
        user.streak_freezes -= missed
        # Treat the frozen days as covered so tomorrow's logic stays simple.
        user.last_streak_date = today - timedelta(days=1)
        return missed
    user.streak_count = 0
    return 0


def is_extended_today(user: User, today: date) -> bool:
    return user.last_streak_date == today


def record_activity(user: User, today: date) -> bool:
    """Register practice for ``today``. Returns True if the streak grew."""
    settle_streak(user, today)
    if user.last_streak_date == today:
        return False
    if user.last_streak_date == today - timedelta(days=1) and user.streak_count > 0:
        user.streak_count += 1
    else:
        user.streak_count = 1
    user.last_streak_date = today
    user.longest_streak = max(user.longest_streak, user.streak_count)
    return True
