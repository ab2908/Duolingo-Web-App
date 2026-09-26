"""Tiered achievements (Wildfire, Sage, Scholar, ...).

Each achievement tracks one metric computed from learner state; its level is
the number of thresholds reached. Newly reached levels are persisted in
``user_achievements`` so they can be announced exactly once.
"""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    Achievement,
    LessonSession,
    Skill,
    Unit,
    User,
    UserAchievement,
    UserSkillProgress,
    XpEvent,
)
from app.services.clock import now_for


def _metrics(db: Session, user: User) -> dict[str, int]:
    completed_sessions = select(func.count(LessonSession.id)).where(
        LessonSession.user_id == user.id, LessonSession.status == "completed"
    )
    lessons = db.scalar(completed_sessions.where(LessonSession.mode == "lesson")) or 0
    perfect = (
        db.scalar(completed_sessions.where(LessonSession.mode == "lesson", LessonSession.mistakes == 0)) or 0
    )
    completed_skills = select(func.count(UserSkillProgress.id)).where(
        UserSkillProgress.user_id == user.id, UserSkillProgress.completed_at.is_not(None)
    )
    legendary = (
        db.scalar(
            select(func.count(UserSkillProgress.id)).where(
                UserSkillProgress.user_id == user.id, UserSkillProgress.is_legendary.is_(True)
            )
        )
        or 0
    )

    # A unit counts as finished when every node in it is completed.
    done_per_unit = dict(
        db.execute(
            select(Skill.unit_id, func.count(UserSkillProgress.id))
            .join(UserSkillProgress, UserSkillProgress.skill_id == Skill.id)
            .where(UserSkillProgress.user_id == user.id, UserSkillProgress.completed_at.is_not(None))
            .group_by(Skill.unit_id)
        ).all()
    )
    size_per_unit = dict(db.execute(select(Unit.id, func.count(Skill.id)).join(Skill).group_by(Unit.id)).all())
    units_done = sum(1 for uid, n in done_per_unit.items() if n >= size_per_unit.get(uid, 1))

    daily_totals = db.scalars(
        select(func.sum(XpEvent.amount))
        .where(XpEvent.user_id == user.id)
        .group_by(XpEvent.activity_date)
    )
    goals_met = sum(1 for total in daily_totals if (total or 0) >= user.daily_goal_xp)

    return {
        "streak": user.longest_streak,
        "total_xp": user.total_xp,
        "lessons_completed": lessons,
        "perfect_lessons": perfect,
        "skills_completed": db.scalar(completed_skills) or 0,
        "units_completed": units_done,
        "legendary_skills": legendary,
        "daily_goals_met": goals_met,
    }


def _level(value: int, thresholds: list[int]) -> int:
    return sum(1 for t in thresholds if value >= t)


def evaluate(db: Session, user: User) -> list[dict]:
    """Persist newly reached levels and return them for the celebration UI."""
    metrics = _metrics(db, user)
    unlocked_rows = {
        ua.achievement_id: ua
        for ua in db.scalars(select(UserAchievement).where(UserAchievement.user_id == user.id))
    }
    newly = []
    for achievement in db.scalars(select(Achievement).order_by(Achievement.id)):
        level = _level(metrics.get(achievement.metric, 0), achievement.thresholds)
        row = unlocked_rows.get(achievement.id)
        if level == 0 or (row is not None and row.level >= level):
            continue
        if row is None:
            row = UserAchievement(user_id=user.id, achievement_id=achievement.id, level=level)
            db.add(row)
        row.level = level
        row.unlocked_at = now_for(user)
        newly.append({"code": achievement.code, "title": achievement.title, "level": level,
                      "icon": achievement.icon, "color": achievement.color})
    return newly


def list_for_user(db: Session, user: User) -> list[dict]:
    metrics = _metrics(db, user)
    result = []
    for achievement in db.scalars(select(Achievement).order_by(Achievement.id)):
        value = metrics.get(achievement.metric, 0)
        thresholds = achievement.thresholds
        level = _level(value, thresholds)
        maxed = level >= len(thresholds)
        goal = thresholds[-1] if maxed else thresholds[level]
        result.append(
            {
                "code": achievement.code,
                "title": achievement.title,
                "description": achievement.description.replace("{n}", str(goal)),
                "icon": achievement.icon,
                "color": achievement.color,
                "level": level,
                "max_level": len(thresholds),
                "progress": min(value, goal),
                "goal": goal,
            }
        )
    return result
