"""Turns the vocabulary/sentence lists in ``content.py`` into exercise specs.

Every regular lesson follows the same rhythm Duolingo uses: introduce words
with picture cards, recognise sentences, then produce them (word bank,
listening, free typing). Randomness is seeded so the course is reproducible.
"""
import random
import re

TOKEN = re.compile(r"[\w'’]+", re.UNICODE)

Word = tuple[str, str, str]
Sentence = tuple[str, str, list[str]]


def tokens(sentence: str) -> list[str]:
    return TOKEN.findall(sentence)


def _option(text: str, *, correct: bool = False, image: str | None = None,
            pair_key: str | None = None, side: str | None = None) -> dict:
    return {"text": text, "image": image, "is_correct": correct, "pair_key": pair_key, "side": side}


def _distractor_tiles(solution: str, pool: list[str], rng: random.Random, count: int) -> list[str]:
    used = {t.lower() for t in tokens(solution)}
    candidates = sorted({t.lower() for s in pool for t in tokens(s)} - used)
    rng.shuffle(candidates)
    return candidates[:count]


def picture_choice(word: Word, words: list[Word], rng: random.Random) -> dict:
    others = [w for w in words if w[0] != word[0]]
    picks = [word, *rng.sample(others, min(2, len(others)))]
    return {
        "type": "multiple_choice",
        "instruction": f"Which one of these is “{word[1]}”?",
        "prompt": word[1],
        "prompt_language": "en",
        "answer_language": "es",
        "solution": word[0],
        "options": [_option(w[0], image=w[2], correct=w is word) for w in picks],
    }


def select_meaning(sentence: Sentence, sentences: list[Sentence], rng: random.Random) -> dict:
    others = [s for s in sentences if s[0] != sentence[0]]
    picks = [sentence, *rng.sample(others, min(2, len(others)))]
    return {
        "type": "multiple_choice",
        "instruction": "Select the correct meaning",
        "prompt": sentence[0],
        "prompt_language": "es",
        "answer_language": "en",
        "solution": sentence[1],
        "options": [_option(s[1], correct=s is sentence) for s in picks],
    }


def translate(sentence: Sentence, sentences: list[Sentence], rng: random.Random, *, to_english: bool) -> dict:
    es, en, alternatives = sentence
    if to_english:
        solution, prompt, accepted, pool = en, es, alternatives, [s[1] for s in sentences]
    else:
        solution, prompt, accepted, pool = es, en, [], [s[0] for s in sentences]
    tiles = tokens(solution) + _distractor_tiles(solution, pool, rng, 4 if len(tokens(solution)) > 3 else 3)
    return {
        "type": "translate",
        "instruction": "Write this in English" if to_english else "Write this in Spanish",
        "prompt": prompt,
        "prompt_language": "es" if to_english else "en",
        "answer_language": "en" if to_english else "es",
        "solution": solution,
        "accepted": accepted,
        "options": [_option(t) for t in tiles],
    }


def listen(sentence: Sentence, sentences: list[Sentence], rng: random.Random) -> dict:
    es = sentence[0]
    tiles = tokens(es) + _distractor_tiles(es, [s[0] for s in sentences], rng, 3)
    return {
        "type": "listen",
        "instruction": "Tap what you hear",
        "prompt": es,
        "hint": sentence[1],
        "prompt_language": "es",
        "answer_language": "es",
        "solution": es,
        "options": [_option(t) for t in tiles],
    }


def match_pairs(words: list[Word]) -> dict:
    options = []
    for i, (es, en, _emoji) in enumerate(words):
        options.append(_option(es, pair_key=f"p{i}", side="left", correct=True))
        options.append(_option(en, pair_key=f"p{i}", side="right", correct=True))
    return {
        "type": "match_pairs",
        "instruction": "Tap the matching pairs",
        "prompt": "",
        "prompt_language": "es",
        "answer_language": "en",
        "solution": ", ".join(f"{es} = {en}" for es, en, _ in words),
        "options": options,
    }


def fill_blank(sentence: Sentence, sentences: list[Sentence], rng: random.Random) -> dict:
    es, en, _ = sentence
    words = tokens(es)
    candidates = [w for w in words if len(w) >= 3] or words
    target = rng.choice(candidates)
    blanked = re.sub(rf"(?<![\w]){re.escape(target)}(?![\w])", "___", es, count=1)
    pool = sorted({t for s in sentences for t in tokens(s[0]) if len(t) >= 3 and t.lower() != target.lower()})
    rng.shuffle(pool)
    distractors = pool[:2]
    return {
        "type": "fill_blank",
        "instruction": "Fill in the blank",
        "prompt": blanked,
        "hint": en,
        "prompt_language": "es",
        "answer_language": "es",
        "solution": es,
        "options": [_option(target, correct=True), *(_option(d) for d in distractors)],
    }


def type_answer(sentence: Sentence, *, to_english: bool) -> dict:
    es, en, alternatives = sentence
    return {
        "type": "type_answer",
        "instruction": "Write this in English" if to_english else "Write this in Spanish",
        "prompt": es if to_english else en,
        "prompt_language": "es" if to_english else "en",
        "answer_language": "en" if to_english else "es",
        "solution": en if to_english else es,
        "accepted": alternatives if to_english else [],
    }


def _rotate(items: list, start: int, count: int) -> list:
    return [items[(start + i) % len(items)] for i in range(count)]


def skill_lessons(skill: dict, rng: random.Random, lesson_count: int = 3) -> list[list[dict]]:
    words: list[Word] = skill["words"]
    sentences: list[Sentence] = skill["sentences"]
    lessons = []
    for i in range(lesson_count):
        s = _rotate(sentences, 2 * i, 6)
        w = _rotate(words, 2 * i, 5)
        lessons.append(
            [
                picture_choice(w[0], words, rng),
                translate(s[0], sentences, rng, to_english=True),
                picture_choice(w[1], words, rng),
                select_meaning(s[1], sentences, rng),
                match_pairs(w),
                fill_blank(s[2], sentences, rng),
                listen(s[3], sentences, rng),
                translate(s[4], sentences, rng, to_english=False),
                type_answer(s[5], to_english=i < lesson_count - 1),
            ]
        )
    return lessons


def review_lesson(skills: list[dict], rng: random.Random) -> list[dict]:
    words = [w for s in skills for w in s["words"]]
    sentences = [x for s in skills for x in s["sentences"]]
    picked = rng.sample(sentences, 7)
    return [
        picture_choice(rng.choice(words), words, rng),
        translate(picked[0], sentences, rng, to_english=True),
        select_meaning(picked[1], sentences, rng),
        match_pairs(rng.sample(words, 5)),
        fill_blank(picked[2], sentences, rng),
        listen(picked[3], sentences, rng),
        translate(picked[4], sentences, rng, to_english=False),
        picture_choice(rng.choice(words), words, rng),
        type_answer(picked[5], to_english=True),
        type_answer(picked[6], to_english=False),
    ]
