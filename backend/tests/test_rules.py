"""Unit tests for the pure gameplay rules."""
from datetime import date, datetime, timedelta
from types import SimpleNamespace

from app.config import HEART_REGEN_MINUTES
from app.services import hearts, streak
from app.services.grading import levenshtein, match_text, normalize

T0 = datetime(2026, 1, 1, 12, 0)
REGEN = timedelta(minutes=HEART_REGEN_MINUTES)


def make_user(**kw):
    defaults = dict(hearts=5, hearts_updated_at=T0, streak_count=0, longest_streak=0,
                    last_streak_date=None, streak_freezes=0)
    return SimpleNamespace(**{**defaults, **kw})


# --- Hearts -----------------------------------------------------------------


def test_losing_a_heart_starts_the_regen_clock():
    user = make_user()
    hearts.lose_heart(user, T0 + timedelta(hours=1))
    assert user.hearts == 4
    assert hearts.next_heart_at(user) == T0 + timedelta(hours=1) + REGEN


def test_hearts_regenerate_one_per_interval_and_cap_at_max():
    user = make_user(hearts=1, hearts_updated_at=T0)
    hearts.sync_hearts(user, T0 + REGEN * 2 + timedelta(minutes=5))
    assert user.hearts == 3
    assert user.hearts_updated_at == T0 + REGEN * 2  # remainder carries over
    hearts.sync_hearts(user, T0 + REGEN * 50)
    assert user.hearts == 5
    assert hearts.next_heart_at(user) is None


def test_cannot_go_below_zero_hearts():
    user = make_user(hearts=0)
    hearts.lose_heart(user, T0)
    assert user.hearts == 0


# --- Streak -----------------------------------------------------------------


def test_streak_grows_once_per_day():
    user = make_user()
    d = date(2026, 3, 1)
    assert streak.record_activity(user, d) is True
    assert streak.record_activity(user, d) is False
    assert streak.record_activity(user, d + timedelta(days=1)) is True
    assert user.streak_count == 2 and user.longest_streak == 2


def test_missing_a_day_resets_the_streak():
    user = make_user(streak_count=10, longest_streak=10, last_streak_date=date(2026, 3, 1))
    streak.settle_streak(user, date(2026, 3, 3))
    assert user.streak_count == 0
    streak.record_activity(user, date(2026, 3, 3))
    assert user.streak_count == 1 and user.longest_streak == 10


def test_streak_freeze_covers_a_missed_day():
    user = make_user(streak_count=4, last_streak_date=date(2026, 3, 1), streak_freezes=1)
    used = streak.settle_streak(user, date(2026, 3, 3))
    assert used == 1 and user.streak_freezes == 0 and user.streak_count == 4
    streak.record_activity(user, date(2026, 3, 3))
    assert user.streak_count == 5


def test_not_enough_freezes_breaks_the_streak():
    user = make_user(streak_count=4, last_streak_date=date(2026, 3, 1), streak_freezes=1)
    streak.settle_streak(user, date(2026, 3, 4))  # two missed days
    assert user.streak_count == 0 and user.streak_freezes == 1


# --- Grading ----------------------------------------------------------------


def exercise(solution, accepted=()):
    return SimpleNamespace(solution=solution, accepted_answers=list(accepted))


def test_normalize_ignores_case_and_punctuation():
    assert normalize("¿Cómo  estás?") == "cómo estás"


def test_text_matching_is_forgiving():
    ex = exercise("I drink milk.", ["I am drinking milk."])
    assert match_text("i drink milk", ex, lenient=True).correct
    assert match_text("I am drinking milk!", ex, lenient=True).correct
    typo = match_text("I drnk milk", ex, lenient=True)
    assert typo.correct and typo.note == "You have a typo."
    assert not match_text("I drink water", ex, lenient=True).correct


def test_missing_accents_are_accepted_with_a_note():
    result = match_text("como estas", exercise("¿Cómo estás?"), lenient=True)
    assert result.correct and "accents" in result.note


def test_word_bank_is_strict():
    assert not match_text("I drnk milk", exercise("I drink milk."), lenient=False).correct


def test_levenshtein():
    assert levenshtein("kitten", "sitting") == 3
    assert levenshtein("", "abc") == 3
