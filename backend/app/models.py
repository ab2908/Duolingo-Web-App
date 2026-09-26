"""SQLAlchemy ORM models.

The schema is split into two halves:

* Course content (read-mostly, seeded): Course -> Unit -> Skill -> Lesson ->
  Exercise -> ExerciseOption.
* Learner state (written during play): User, UserSkillProgress,
  LessonSession -> SessionExercise / SessionAnswer, XpEvent, GemTransaction,
  UserAchievement.

XP and gems keep a denormalised running total on ``users`` for cheap reads,
while ``xp_events`` / ``gem_transactions`` are the append-only ledgers that
the leaderboard, daily goal, streak calendar and history are derived from.
"""
from datetime import date, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

EXERCISE_TYPES = ("multiple_choice", "translate", "match_pairs", "fill_blank", "type_answer", "listen")
SKILL_KINDS = ("skill", "chest", "review")
SESSION_MODES = ("lesson", "practice", "legendary")
SESSION_STATUSES = ("in_progress", "completed", "failed", "abandoned")


def _in(column: str, values: tuple[str, ...]) -> str:
    return f"{column} IN ({', '.join(repr(v) for v in values)})"


# ---------------------------------------------------------------------------
# Course content
# ---------------------------------------------------------------------------


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    learning_language: Mapped[str] = mapped_column(String(8))  # e.g. "es"
    from_language: Mapped[str] = mapped_column(String(8))  # e.g. "en"
    title: Mapped[str] = mapped_column(String(80))
    flag: Mapped[str] = mapped_column(String(8))

    units: Mapped[list["Unit"]] = relationship(
        back_populates="course", order_by="Unit.position", cascade="all, delete-orphan"
    )

    __table_args__ = (UniqueConstraint("learning_language", "from_language"),)


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(Integer)
    section: Mapped[int] = mapped_column(Integer, default=1)
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(255))
    color: Mapped[str] = mapped_column(String(16))  # theme key used by the frontend
    guidebook: Mapped[str] = mapped_column(Text, default="")  # short grammar notes (markdown)

    course: Mapped[Course] = relationship(back_populates="units")
    skills: Mapped[list["Skill"]] = relationship(
        back_populates="unit", order_by="Skill.position", cascade="all, delete-orphan"
    )

    __table_args__ = (UniqueConstraint("course_id", "position"),)


class Skill(Base):
    """A node on the learning path.

    ``kind`` distinguishes normal skills, treasure chests (gem rewards) and the
    unit review node at the end of every unit.
    """

    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(Integer)
    kind: Mapped[str] = mapped_column(String(10), default="skill")
    title: Mapped[str] = mapped_column(String(80))
    icon: Mapped[str] = mapped_column(String(24), default="star")

    unit: Mapped[Unit] = relationship(back_populates="skills")
    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="skill", order_by="Lesson.position", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("unit_id", "position"),
        CheckConstraint(_in("kind", SKILL_KINDS), name="ck_skill_kind"),
    )


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(Integer)

    skill: Mapped[Skill] = relationship(back_populates="lessons")
    exercises: Mapped[list["Exercise"]] = relationship(
        back_populates="lesson", order_by="Exercise.position", cascade="all, delete-orphan"
    )

    __table_args__ = (UniqueConstraint("skill_id", "position"),)


class Exercise(Base):
    """One challenge inside a lesson.

    ``solution`` is the canonical answer shown in the feedback bar and
    ``accepted_answers`` lists alternative correct answers. Neither is ever
    sent to the client before the learner answers; grading happens server-side.
    """

    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(Integer)
    type: Mapped[str] = mapped_column(String(20))
    instruction: Mapped[str] = mapped_column(String(160))  # "Write this in English"
    prompt: Mapped[str] = mapped_column(String(255), default="")  # sentence / word shown
    hint: Mapped[str | None] = mapped_column(String(255), nullable=True)  # e.g. translation under a blank
    prompt_language: Mapped[str] = mapped_column(String(8), default="es")  # for text-to-speech
    answer_language: Mapped[str] = mapped_column(String(8), default="en")
    solution: Mapped[str] = mapped_column(String(255))
    accepted_answers: Mapped[list[str]] = mapped_column(JSON, default=list)

    lesson: Mapped[Lesson] = relationship(back_populates="exercises")
    options: Mapped[list["ExerciseOption"]] = relationship(
        back_populates="exercise", order_by="ExerciseOption.position", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("lesson_id", "position"),
        CheckConstraint(_in("type", EXERCISE_TYPES), name="ck_exercise_type"),
    )


class ExerciseOption(Base):
    """A selectable piece of an exercise.

    * multiple_choice / fill_blank: one row per choice, ``is_correct`` marks the answer.
    * translate / listen: one row per word-bank tile (solution tiles + distractors).
    * match_pairs: two rows per pair sharing ``pair_key``, with ``side`` left/right.
    """

    __tablename__ = "exercise_options"

    id: Mapped[int] = mapped_column(primary_key=True)
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(String(120))
    image: Mapped[str | None] = mapped_column(String(16), nullable=True)  # emoji illustration
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    pair_key: Mapped[str | None] = mapped_column(String(40), nullable=True)
    side: Mapped[str | None] = mapped_column(String(5), nullable=True)

    exercise: Mapped[Exercise] = relationship(back_populates="options")

    __table_args__ = (
        UniqueConstraint("exercise_id", "position"),
        CheckConstraint("side IS NULL OR side IN ('left', 'right')", name="ck_option_side"),
    )


# ---------------------------------------------------------------------------
# Learner state
# ---------------------------------------------------------------------------


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(40), unique=True)
    display_name: Mapped[str] = mapped_column(String(60))
    avatar_color: Mapped[str] = mapped_column(String(16), default="blue")
    is_bot: Mapped[bool] = mapped_column(Boolean, default=False)  # seeded leaderboard rivals
    bot_activity: Mapped[int] = mapped_column(Integer, default=0)  # avg daily XP for bots
    created_at: Mapped[datetime] = mapped_column(DateTime)
    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    current_course_id: Mapped[int | None] = mapped_column(ForeignKey("courses.id"), nullable=True)

    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    gems: Mapped[int] = mapped_column(Integer, default=0)

    # Hearts regenerate lazily: the stored value is correct as of hearts_updated_at.
    hearts: Mapped[int] = mapped_column(Integer, default=5)
    hearts_updated_at: Mapped[datetime] = mapped_column(DateTime)

    streak_count: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_streak_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    streak_freezes: Mapped[int] = mapped_column(Integer, default=0)

    daily_goal_xp: Mapped[int] = mapped_column(Integer, default=20)
    sound_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    listening_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    # Simulated clock offset, lets testers "time travel" to exercise streak/heart logic.
    time_offset_minutes: Mapped[int] = mapped_column(Integer, default=0)

    skill_progress: Mapped[list["UserSkillProgress"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("hearts >= 0 AND hearts <= 5", name="ck_user_hearts"),
        CheckConstraint("gems >= 0", name="ck_user_gems"),
    )


class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"))
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_legendary: Mapped[bool] = mapped_column(Boolean, default=False)
    practice_count: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped[User] = relationship(back_populates="skill_progress")
    skill: Mapped[Skill] = relationship()

    __table_args__ = (UniqueConstraint("user_id", "skill_id"),)


class LessonSession(Base):
    """A single play-through of a lesson, practice or legendary challenge."""

    __tablename__ = "lesson_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    skill_id: Mapped[int | None] = mapped_column(ForeignKey("skills.id"), nullable=True)
    lesson_id: Mapped[int | None] = mapped_column(ForeignKey("lessons.id"), nullable=True)
    mode: Mapped[str] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(12), default="in_progress")
    started_at: Mapped[datetime] = mapped_column(DateTime)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    mistakes: Mapped[int] = mapped_column(Integer, default=0)
    hearts_lost: Mapped[int] = mapped_column(Integer, default=0)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    accuracy: Mapped[int | None] = mapped_column(Integer, nullable=True)  # % right first try

    skill: Mapped[Skill | None] = relationship()

    exercises: Mapped[list["SessionExercise"]] = relationship(
        order_by="SessionExercise.position", cascade="all, delete-orphan"
    )
    answers: Mapped[list["SessionAnswer"]] = relationship(cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(_in("mode", SESSION_MODES), name="ck_session_mode"),
        CheckConstraint(_in("status", SESSION_STATUSES), name="ck_session_status"),
        Index("ix_sessions_user_status", "user_id", "status"),
    )


class SessionExercise(Base):
    """The ordered exercise list served for a session (practice mixes lessons)."""

    __tablename__ = "session_exercises"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("lesson_sessions.id", ondelete="CASCADE"))
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(Integer)

    exercise: Mapped[Exercise] = relationship()

    __table_args__ = (UniqueConstraint("session_id", "exercise_id"),)


class SessionAnswer(Base):
    __tablename__ = "session_answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("lesson_sessions.id", ondelete="CASCADE"))
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id", ondelete="CASCADE"))
    answer: Mapped[str] = mapped_column(Text)
    is_correct: Mapped[bool] = mapped_column(Boolean)
    answered_at: Mapped[datetime] = mapped_column(DateTime)

    __table_args__ = (Index("ix_answers_session", "session_id"),)


class XpEvent(Base):
    """Append-only XP ledger. ``activity_date`` is the learner's local date."""

    __tablename__ = "xp_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    session_id: Mapped[int | None] = mapped_column(ForeignKey("lesson_sessions.id"), nullable=True)
    amount: Mapped[int] = mapped_column(Integer)
    source: Mapped[str] = mapped_column(String(20))  # lesson | practice | legendary | review | bot
    activity_date: Mapped[date] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime)

    __table_args__ = (Index("ix_xp_user_date", "user_id", "activity_date"),)


class GemTransaction(Base):
    """Append-only gem ledger (chests, purchases, refills)."""

    __tablename__ = "gem_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    amount: Mapped[int] = mapped_column(Integer)  # positive = earned, negative = spent
    reason: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(DateTime)


class Achievement(Base):
    """A tiered achievement. ``thresholds`` holds the metric value for each level."""

    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True)
    title: Mapped[str] = mapped_column(String(60))
    description: Mapped[str] = mapped_column(String(160))  # "{n}" is replaced by the next threshold
    icon: Mapped[str] = mapped_column(String(24))
    color: Mapped[str] = mapped_column(String(16))
    metric: Mapped[str] = mapped_column(String(30))
    thresholds: Mapped[list[int]] = mapped_column(JSON)


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    achievement_id: Mapped[int] = mapped_column(ForeignKey("achievements.id", ondelete="CASCADE"))
    level: Mapped[int] = mapped_column(Integer)
    unlocked_at: Mapped[datetime] = mapped_column(DateTime)

    achievement: Mapped[Achievement] = relationship()

    __table_args__ = (UniqueConstraint("user_id", "achievement_id"),)
