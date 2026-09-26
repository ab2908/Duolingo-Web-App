"""Server-side answer checking.

Answers never leave the server before the learner submits, so grading lives
here. Free-text answers are forgiving the way Duolingo is: case, punctuation
and extra whitespace are ignored, missing accents and single-letter typos are
accepted with a gentle note.
"""
import re
import unicodedata
from dataclasses import dataclass

from app.models import Exercise

_PUNCTUATION = re.compile(r"[.,!?¿¡;:\"()«»…]")
_WHITESPACE = re.compile(r"\s+")


@dataclass
class GradeResult:
    correct: bool
    solution: str
    note: str | None = None


class InvalidAnswer(ValueError):
    pass


def normalize(text: str) -> str:
    text = text.lower().replace("’", "'")
    text = _PUNCTUATION.sub(" ", text)
    return _WHITESPACE.sub(" ", text).strip()


def strip_accents(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(c for c in decomposed if unicodedata.category(c) != "Mn")


def levenshtein(a: str, b: str) -> int:
    if len(a) < len(b):
        a, b = b, a
    previous = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        current = [i]
        for j, cb in enumerate(b, 1):
            current.append(min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (ca != cb)))
        previous = current
    return previous[-1]


def accepted(exercise: Exercise) -> list[str]:
    return [exercise.solution, *(exercise.accepted_answers or [])]


def match_text(given: str, exercise: Exercise, *, lenient: bool) -> GradeResult:
    target = normalize(given)
    candidates = [normalize(a) for a in accepted(exercise)]
    if target in candidates:
        return GradeResult(True, exercise.solution)
    if not lenient or not target:
        return GradeResult(False, exercise.solution)

    if strip_accents(target) in {strip_accents(c) for c in candidates}:
        return GradeResult(True, exercise.solution, "Pay attention to the accents.")
    for candidate in candidates:
        if len(candidate) >= 5 and levenshtein(strip_accents(target), strip_accents(candidate)) <= 1:
            return GradeResult(True, exercise.solution, "You have a typo.")
    return GradeResult(False, exercise.solution)


def grade(exercise: Exercise, answer: object) -> GradeResult:
    if answer is None:  # the learner pressed "Skip"
        return GradeResult(False, exercise.solution)
    options = {o.id: o for o in exercise.options}

    if exercise.type in ("multiple_choice", "fill_blank"):
        if not isinstance(answer, int) or answer not in options:
            raise InvalidAnswer("Expected the id of one option")
        return GradeResult(options[answer].is_correct, exercise.solution)

    if exercise.type in ("translate", "listen"):
        if not isinstance(answer, list) or not all(isinstance(i, int) and i in options for i in answer):
            raise InvalidAnswer("Expected a list of word-bank option ids")
        if len(set(answer)) != len(answer):
            raise InvalidAnswer("A tile can only be used once")
        sentence = " ".join(options[i].text for i in answer)
        return match_text(sentence, exercise, lenient=False)

    if exercise.type == "match_pairs":
        if not isinstance(answer, list) or not all(
            isinstance(p, list) and len(p) == 2 and all(isinstance(i, int) and i in options for i in p)
            for p in answer
        ):
            raise InvalidAnswer("Expected a list of [left_id, right_id] pairs")
        pair_count = sum(1 for o in exercise.options if o.side == "left")
        used = [i for pair in answer for i in pair]
        all_match = all(
            options[left].side == "left"
            and options[right].side == "right"
            and options[left].pair_key == options[right].pair_key
            for left, right in answer
        )
        complete = len(answer) == pair_count and len(set(used)) == len(used)
        return GradeResult(all_match and complete, exercise.solution)

    if exercise.type == "type_answer":
        if not isinstance(answer, str):
            raise InvalidAnswer("Expected free text")
        return match_text(answer, exercise, lenient=True)

    raise InvalidAnswer(f"Unsupported exercise type {exercise.type}")
