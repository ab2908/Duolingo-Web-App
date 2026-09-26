"""Database seeding: course content, achievements, the demo learner and rivals.

Run manually with ``python -m app.seed.seed`` (drops and recreates the DB) or
rely on the API, which seeds an empty database at start-up.
"""
import random
from datetime import timedelta

from sqlalchemy import Engine, select
from sqlalchemy.orm import Session

from app.database import Base
from app.models import (
    Achievement,
    Course,
    Exercise,
    ExerciseOption,
    GemTransaction,
    Lesson,
    LessonSession,
    Skill,
    Unit,
    User,
    UserSkillProgress,
    XpEvent,
)
from app.seed import builder
from app.seed.content import ACHIEVEMENTS, COURSE, RIVALS, UNITS
from app.services import achievements
from app.services.clock import utcnow

SEED = 2024


def _add_lesson(skill: Skill, position: int, specs: list[dict]) -> None:
    lesson = Lesson(position=position)
    for i, spec in enumerate(specs):
        exercise = Exercise(
            position=i,
            type=spec["type"],
            instruction=spec["instruction"],
            prompt=spec.get("prompt", ""),
            hint=spec.get("hint"),
            prompt_language=spec.get("prompt_language", "es"),
            answer_language=spec.get("answer_language", "en"),
            solution=spec["solution"],
            accepted_answers=spec.get("accepted", []),
        )
        exercise.options = [ExerciseOption(position=j, **opt) for j, opt in enumerate(spec.get("options", []))]
        lesson.exercises.append(exercise)
    skill.lessons.append(lesson)


def seed_course(db: Session) -> Course:
    rng = random.Random(SEED)
    course = Course(**COURSE)
    for u_pos, unit_data in enumerate(UNITS, 1):
        unit = Unit(position=u_pos, section=1, title=unit_data["title"], description=unit_data["description"],
                    color=unit_data["color"], guidebook=unit_data["guidebook"])
        teaching_skills = [s for s in unit_data["skills"] if s.get("kind", "skill") == "skill"]
        for s_pos, skill_data in enumerate(unit_data["skills"], 1):
            kind = skill_data.get("kind", "skill")
            skill = Skill(position=s_pos, kind=kind, title=skill_data["title"], icon=skill_data["icon"])
            if kind == "skill":
                for l_pos, specs in enumerate(builder.skill_lessons(skill_data, rng)):
                    _add_lesson(skill, l_pos, specs)
            elif kind == "review":
                _add_lesson(skill, 0, builder.review_lesson(teaching_skills, rng))
            unit.skills.append(skill)
        course.units.append(unit)
    db.add(course)
    db.flush()
    return course


def seed_achievements(db: Session) -> None:
    for code, title, description, icon, color, metric, thresholds in ACHIEVEMENTS:
        db.add(Achievement(code=code, title=title, description=description, icon=icon, color=color,
                           metric=metric, thresholds=thresholds))


def seed_rivals(db: Session, course: Course) -> None:
    rng = random.Random(SEED)
    now = utcnow()
    for username, name, color, activity in RIVALS:
        db.add(User(username=username, display_name=name, avatar_color=color, is_bot=True, bot_activity=activity,
                    created_at=now - timedelta(days=rng.randint(30, 400)), hearts_updated_at=now,
                    total_xp=rng.randint(4, 60) * 100, current_course_id=course.id))


def seed_learner(db: Session, course: Course) -> User:
    """A learner a few days into the course, so every screen has something to show."""
    now = utcnow()
    learner = User(
        username="alex_learns",
        display_name="Alex",
        avatar_color="blue",
        created_at=now - timedelta(days=12),
        current_course_id=course.id,
        gems=500,
        hearts=4,
        hearts_updated_at=now - timedelta(hours=1),
        daily_goal_xp=20,
        streak_freezes=1,
    )
    db.add(learner)
    db.flush()
    db.add(GemTransaction(user_id=learner.id, amount=500, reason="welcome_bonus", created_at=learner.created_at))

    unit1 = course.units[0]
    cafe, thanks, chest, food = unit1.skills[0], unit1.skills[1], unit1.skills[2], unit1.skills[3]
    # (skill, lesson index, days ago, mistakes)
    history = [
        (cafe, 0, 3, 1), (cafe, 1, 3, 0), (cafe, 2, 3, 2),
        (thanks, 0, 2, 0), (thanks, 1, 2, 1),
        (thanks, 2, 1, 0), (food, 0, 1, 1),
    ]
    for skill, lesson_index, days_ago, mistakes in history:
        finished = now - timedelta(days=days_ago, hours=2)
        xp = 10 + (5 if mistakes == 0 else 0)
        session = LessonSession(user_id=learner.id, skill_id=skill.id, lesson_id=skill.lessons[lesson_index].id,
                                mode="lesson", status="completed", started_at=finished - timedelta(minutes=4),
                                finished_at=finished, mistakes=mistakes, xp_earned=xp,
                                accuracy=round(100 * (9 - mistakes) / 9))
        db.add(session)
        db.flush()
        db.add(XpEvent(user_id=learner.id, session_id=session.id, amount=xp, source="lesson",
                       activity_date=finished.date(), created_at=finished))
        learner.total_xp += xp

    for skill, done in ((cafe, 3), (thanks, 3), (food, 1)):
        db.add(UserSkillProgress(user_id=learner.id, skill_id=skill.id, lessons_completed=done,
                                 completed_at=now - timedelta(days=1) if done == len(skill.lessons) else None))
    db.add(UserSkillProgress(user_id=learner.id, skill_id=chest.id, lessons_completed=0,
                             completed_at=now - timedelta(days=1)))
    db.add(GemTransaction(user_id=learner.id, amount=20, reason="chest", created_at=now - timedelta(days=1)))
    learner.gems += 20

    learner.streak_count = 3
    learner.longest_streak = 5
    learner.last_streak_date = (now - timedelta(days=1)).date()
    db.flush()
    achievements.evaluate(db, learner)
    return learner


def seed_all(db: Session) -> None:
    course = seed_course(db)
    seed_achievements(db)
    db.flush()
    seed_learner(db, course)  # id 1: the default logged-in learner
    seed_rivals(db, course)
    db.commit()


def ensure_seeded(engine: Engine) -> None:
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        if db.scalars(select(Course)).first() is None:
            seed_all(db)


def reset_database(engine: Engine) -> None:
    Base.metadata.drop_all(engine)
    ensure_seeded(engine)


if __name__ == "__main__":
    from app.database import engine as default_engine

    reset_database(default_engine)
    print("Database reset and seeded.")
