from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app import config
from app.models import Exercise, ExerciseOption, Lesson, LessonSession, User, UserSkillProgress
from app.services import achievements, hearts, progress, stats
from app.services.clock import now_for, today_for


def me_view(db: Session, user: User) -> dict:
    course = progress.get_course(db, user)
    today = today_for(user)
    next_heart = hearts.next_heart_at(user)
    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "avatar_color": user.avatar_color,
        "created_at": user.created_at.isoformat(),
        "course": {
            "id": course.id,
            "title": course.title,
            "flag": course.flag,
            "learning_language": course.learning_language,
            "from_language": course.from_language,
        },
        "total_xp": user.total_xp,
        "gems": user.gems,
        "hearts": user.hearts,
        "max_hearts": config.MAX_HEARTS,
        "next_heart_at": next_heart.isoformat() + "Z" if next_heart else None,
        "heart_regen_minutes": config.HEART_REGEN_MINUTES,
        "refill_cost": config.HEART_REFILL_COST_GEMS,
        "streak": user.streak_count,
        "longest_streak": user.longest_streak,
        "streak_extended_today": user.last_streak_date == today,
        "streak_freezes": user.streak_freezes,
        "daily_goal_xp": user.daily_goal_xp,
        "xp_today": stats.xp_on(db, user, today),
        "sound_enabled": user.sound_enabled,
        "listening_enabled": user.listening_enabled,
        "timezone": user.timezone,
        "now": now_for(user).isoformat() + "Z",
        "today": today.isoformat(),
        "time_offset_minutes": user.time_offset_minutes,
    }


def words_learned(db: Session, user: User) -> int:
    """Distinct vocabulary items from match-pair exercises in finished lessons."""
    stmt = (
        select(func.count(distinct(ExerciseOption.text)))
        .join(Exercise, ExerciseOption.exercise_id == Exercise.id)
        .join(Lesson, Exercise.lesson_id == Lesson.id)
        .join(UserSkillProgress, UserSkillProgress.skill_id == Lesson.skill_id)
        .where(
            UserSkillProgress.user_id == user.id,
            Lesson.position < UserSkillProgress.lessons_completed,
            Exercise.type == "match_pairs",
            ExerciseOption.side == "left",
        )
    )
    return db.scalar(stmt) or 0


def profile_view(db: Session, user: User) -> dict:
    lessons = db.scalar(
        select(func.count(LessonSession.id)).where(
            LessonSession.user_id == user.id,
            LessonSession.status == "completed",
            LessonSession.mode == "lesson",
        )
    )
    skills = db.scalar(
        select(func.count(UserSkillProgress.id)).where(
            UserSkillProgress.user_id == user.id, UserSkillProgress.completed_at.is_not(None)
        )
    )
    return {
        "me": me_view(db, user),
        "league": "Bronze",
        "lessons_completed": lessons or 0,
        "skills_completed": skills or 0,
        "words_learned": words_learned(db, user),
        "achievements": achievements.list_for_user(db, user),
        "xp_last_7_days": stats.last_days(db, user, 7),
        "streak_week": stats.streak_week(db, user),
    }
