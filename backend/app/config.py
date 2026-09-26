"""Application settings and game-balance constants.

Everything tunable lives here so gameplay rules are easy to find and to
override through environment variables in deployment.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'duolingo.db'}")

# Comma-separated list of allowed frontend origins. "*" allows everything.
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]

# The app assumes a single logged-in learner (auth is out of scope).
DEFAULT_USER_ID = int(os.getenv("DEFAULT_USER_ID", "1"))

# Enables the /api/dev endpoints (time travel, reset) used to test streak logic.
ENABLE_DEV_TOOLS = os.getenv("ENABLE_DEV_TOOLS", "true").lower() == "true"

# --- Hearts -----------------------------------------------------------------
MAX_HEARTS = 5
HEART_REGEN_MINUTES = int(os.getenv("HEART_REGEN_MINUTES", "240"))  # 1 heart / 4h
HEART_REFILL_COST_GEMS = 350

# --- XP ---------------------------------------------------------------------
LESSON_XP = 10
PERFECT_LESSON_BONUS_XP = 5
PRACTICE_XP = 5
LEGENDARY_XP = 40
REVIEW_XP = 15

# --- Legendary --------------------------------------------------------------
LEGENDARY_MAX_MISTAKES = 3
LEGENDARY_TIME_LIMIT_SECONDS = 180

# --- Economy ----------------------------------------------------------------
CHEST_GEMS = 20
STREAK_FREEZE_COST_GEMS = 200
MAX_STREAK_FREEZES = 2

DAILY_GOAL_OPTIONS = [10, 20, 30, 50]
