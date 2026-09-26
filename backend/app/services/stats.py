"""Read models derived from the XP ledger: daily goal, quests, calendars, leagues."""
import random
from datetime import date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import LessonSession, User, XpEvent
from app.services.clock import local_date, local_datetime, now_for, today_for, week_start

PROMOTION_ZONE = 7
DEMOTION_ZONE = 5


def xp_on(db: Session, user: User, day: date) -> int:
    return db.scalar(
        select(func.coalesce(func.sum(XpEvent.amount), 0)).where(
            XpEvent.user_id == user.id, XpEvent.activity_date == day
        )
    )


def xp_by_day(db: Session, user: User, start: date, end: date) -> dict[date, int]:
    rows = db.execute(
        select(XpEvent.activity_date, func.sum(XpEvent.amount))
        .where(XpEvent.user_id == user.id, XpEvent.activity_date.between(start, end))
        .group_by(XpEvent.activity_date)
    ).all()
    return {d: int(total) for d, total in rows}


def last_days(db: Session, user: User, days: int = 7) -> list[dict]:
    today = today_for(user)
    start = today - timedelta(days=days - 1)
    totals = xp_by_day(db, user, start, today)
    return [
        {"date": (start + timedelta(days=i)).isoformat(), "xp": totals.get(start + timedelta(days=i), 0)}
        for i in range(days)
    ]


def streak_week(db: Session, user: User) -> list[dict]:
    """Monday-to-Sunday strip shown on the streak screen and in the flame popover."""
    today = today_for(user)
    start = week_start(today)
    totals = xp_by_day(db, user, start, start + timedelta(days=6))
    return [
        {
            "date": (start + timedelta(days=i)).isoformat(),
            "active": totals.get(start + timedelta(days=i), 0) > 0,
            "is_today": start + timedelta(days=i) == today,
        }
        for i in range(7)
    ]


def _sessions_today(db: Session, user: User) -> list[LessonSession]:
    today = today_for(user)
    recent = db.scalars(
        select(LessonSession).where(
            LessonSession.user_id == user.id,
            LessonSession.status == "completed",
            LessonSession.finished_at >= now_for(user) - timedelta(days=2),
        )
    )
    return [s for s in recent if s.finished_at and local_date(user, s.finished_at) == today]


def daily_quests(db: Session, user: User) -> list[dict]:
    today = today_for(user)
    sessions = _sessions_today(db, user)
    high_accuracy = sum(1 for s in sessions if (s.accuracy or 0) >= 90)
    quests = [
        ("xp", f"Earn {user.daily_goal_xp} XP", xp_on(db, user, today), user.daily_goal_xp, "bolt"),
        ("lessons", "Complete 2 lessons", len(sessions), 2, "target"),
        ("accuracy", "Score 90% or higher in 2 lessons", high_accuracy, 2, "bullseye"),
    ]
    return [
        {"code": code, "title": title, "progress": min(value, goal), "goal": goal, "icon": icon,
         "completed": value >= goal}
        for code, title, value, goal, icon in quests
    ]


# --- Leaderboard ------------------------------------------------------------


def _bot_daily_xp(bot: User, day: date) -> int:
    rng = random.Random(f"{bot.id}:{day.isoformat()}")
    if rng.random() > 0.8:  # bots skip about one day in five
        return 0
    amount = rng.gauss(bot.bot_activity, bot.bot_activity * 0.35)
    return max(5, int(round(amount / 5.0)) * 5)


def simulate_bots(db: Session, viewer: User) -> None:
    """Backfill XP for seeded rivals so the weekly league stays alive.

    Past days get their full deterministic amount, today grows with the time
    of day. Amounts only ever increase, so repeated calls are idempotent.
    """
    now = now_for(viewer)
    today = local_date(viewer, now)
    start = week_start(today)
    local_now = local_datetime(viewer, now)
    day_fraction = (local_now.hour * 60 + local_now.minute) / (24 * 60)

    bots = list(db.scalars(select(User).where(User.is_bot.is_(True))))
    if not bots:
        return
    existing = {
        (uid, d): int(total)
        for uid, d, total in db.execute(
            select(XpEvent.user_id, XpEvent.activity_date, func.sum(XpEvent.amount))
            .where(XpEvent.user_id.in_([b.id for b in bots]), XpEvent.activity_date.between(start, today))
            .group_by(XpEvent.user_id, XpEvent.activity_date)
        ).all()
    }
    for bot in bots:
        day = start
        while day <= today:
            target = _bot_daily_xp(bot, day)
            if day == today:
                target = int(target * day_fraction / 5) * 5
            have = existing.get((bot.id, day), 0)
            if target > have:
                db.add(XpEvent(user_id=bot.id, amount=target - have, source="bot", activity_date=day,
                               created_at=datetime.combine(day, datetime.min.time())))
                bot.total_xp += target - have
            day += timedelta(days=1)
    db.flush()


def leaderboard(db: Session, viewer: User) -> dict:
    simulate_bots(db, viewer)
    today = today_for(viewer)
    start = week_start(today)
    weekly = dict(
        db.execute(
            select(XpEvent.user_id, func.sum(XpEvent.amount))
            .where(XpEvent.activity_date.between(start, today))
            .group_by(XpEvent.user_id)
        ).all()
    )
    users = list(db.scalars(select(User)))
    ranked = sorted(users, key=lambda u: (-int(weekly.get(u.id, 0)), u.id != viewer.id, u.display_name))
    total = len(ranked)
    entries = []
    for rank, u in enumerate(ranked, 1):
        zone = "promotion" if rank <= PROMOTION_ZONE else "demotion" if rank > total - DEMOTION_ZONE else "safe"
        entries.append(
            {
                "rank": rank,
                "user_id": u.id,
                "display_name": u.display_name,
                "avatar_color": u.avatar_color,
                "weekly_xp": int(weekly.get(u.id, 0)),
                "is_me": u.id == viewer.id,
                "zone": zone,
            }
        )
    week_end = start + timedelta(days=7)
    return {
        "league": "Bronze",
        "week_start": start.isoformat(),
        "days_left": (week_end - today).days,
        "promotion_zone": PROMOTION_ZONE,
        "demotion_zone": DEMOTION_ZONE,
        "entries": entries,
    }
