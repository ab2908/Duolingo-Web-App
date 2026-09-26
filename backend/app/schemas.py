"""Request/response contracts (also drive the OpenAPI docs at /docs)."""
from typing import Literal

from pydantic import BaseModel, Field

SessionMode = Literal["lesson", "practice", "legendary"]
AnswerPayload = int | str | list[int] | list[list[int]]


# --- User -------------------------------------------------------------------


class CourseSummary(BaseModel):
    id: int
    title: str
    flag: str
    learning_language: str
    from_language: str


class Me(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_color: str
    created_at: str
    course: CourseSummary
    total_xp: int
    gems: int
    hearts: int
    max_hearts: int
    next_heart_at: str | None
    heart_regen_minutes: int
    refill_cost: int
    streak: int
    longest_streak: int
    streak_extended_today: bool
    streak_freezes: int
    daily_goal_xp: int
    xp_today: int
    sound_enabled: bool
    listening_enabled: bool
    timezone: str
    now: str
    today: str
    time_offset_minutes: int


class SettingsUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=60)
    daily_goal_xp: int | None = None
    sound_enabled: bool | None = None
    listening_enabled: bool | None = None
    timezone: str | None = None


# --- Path -------------------------------------------------------------------


class PathSkill(BaseModel):
    id: int
    kind: Literal["skill", "chest", "review"]
    title: str
    icon: str
    position: int
    state: Literal["completed", "active", "locked"]
    lessons_completed: int
    total_lessons: int
    is_legendary: bool


class PathUnit(BaseModel):
    id: int
    position: int
    section: int
    title: str
    description: str
    color: str
    has_guidebook: bool
    completed: bool
    skills: list[PathSkill]


class LearningPath(BaseModel):
    course: CourseSummary
    units: list[PathUnit]
    active_skill_id: int | None


class Guidebook(BaseModel):
    unit_id: int
    title: str
    description: str
    color: str
    content: str


class ChestResult(BaseModel):
    gems_awarded: int
    gems: int


# --- Sessions ---------------------------------------------------------------


class StartSession(BaseModel):
    skill_id: int | None = None
    mode: SessionMode = "lesson"


class ExerciseOptionOut(BaseModel):
    id: int
    text: str
    image: str | None
    side: Literal["left", "right"] | None
    pair_key: str | None


class ExerciseOut(BaseModel):
    id: int
    type: Literal["multiple_choice", "translate", "match_pairs", "fill_blank", "type_answer", "listen"]
    instruction: str
    prompt: str
    hint: str | None
    prompt_language: str
    answer_language: str
    options: list[ExerciseOptionOut]


class SessionOut(BaseModel):
    id: int
    mode: SessionMode
    skill_id: int | None
    lesson_id: int | None
    title: str
    hearts: int
    max_mistakes: int | None
    time_limit_seconds: int | None
    uses_hearts: bool
    exercises: list[ExerciseOut]


class AnswerIn(BaseModel):
    exercise_id: int
    answer: AnswerPayload | None = Field(description="null means the learner skipped the exercise")


class SkipListeningIn(BaseModel):
    exercise_id: int


class AnswerResult(BaseModel):
    correct: bool
    solution: str
    note: str | None
    hearts: int
    mistakes: int
    session_status: Literal["in_progress", "completed", "failed", "abandoned"]


class StreakWeekDay(BaseModel):
    date: str
    active: bool
    is_today: bool


class StreakSummary(BaseModel):
    count: int
    extended: bool
    week: list[StreakWeekDay]


class DailyGoalSummary(BaseModel):
    goal: int
    xp_today: int
    just_completed: bool


class SkillSummary(BaseModel):
    id: int
    title: str
    lessons_completed: int
    total_lessons: int
    completed: bool
    level_up: bool
    is_legendary: bool


class AchievementUnlock(BaseModel):
    code: str
    title: str
    level: int
    icon: str
    color: str


class SessionSummary(BaseModel):
    session_id: int
    mode: SessionMode
    xp_earned: int
    base_xp: int
    bonus_xp: int
    accuracy: int
    mistakes: int
    duration_seconds: int
    hearts: int
    hearts_gained: int
    total_xp: int
    streak: StreakSummary
    daily_goal: DailyGoalSummary
    skill: SkillSummary | None
    new_achievements: list[AchievementUnlock]


# --- Gamification -----------------------------------------------------------


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    display_name: str
    avatar_color: str
    weekly_xp: int
    is_me: bool
    zone: Literal["promotion", "safe", "demotion"]


class Leaderboard(BaseModel):
    league: str
    week_start: str
    days_left: int
    promotion_zone: int
    demotion_zone: int
    entries: list[LeaderboardEntry]


class Quest(BaseModel):
    code: str
    title: str
    progress: int
    goal: int
    icon: str
    completed: bool


class AchievementOut(BaseModel):
    code: str
    title: str
    description: str
    icon: str
    color: str
    level: int
    max_level: int
    progress: int
    goal: int


class DayXp(BaseModel):
    date: str
    xp: int


class Profile(BaseModel):
    me: Me
    league: str
    lessons_completed: int
    skills_completed: int
    words_learned: int
    achievements: list[AchievementOut]
    xp_last_7_days: list[DayXp]
    streak_week: list[StreakWeekDay]


class ShopItem(BaseModel):
    code: Literal["heart_refill", "streak_freeze"]
    title: str
    description: str
    price: int
    available: bool
    owned: int | None = None
    reason: str | None = None


class Shop(BaseModel):
    gems: int
    items: list[ShopItem]


class PurchaseIn(BaseModel):
    item: Literal["heart_refill", "streak_freeze"]


class TimeTravelIn(BaseModel):
    hours: int = Field(ge=1, le=24 * 30)
