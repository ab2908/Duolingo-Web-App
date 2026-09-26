"""Learning-path progression.

The path is linear: nodes are ordered by (unit.position, skill.position). Every
node before the first unfinished one is ``completed``, that node is ``active``
and everything after it is ``locked``.
"""
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Course, Lesson, Skill, Unit, User, UserSkillProgress


def get_course(db: Session, user: User) -> Course:
    course = db.get(Course, user.current_course_id) if user.current_course_id else None
    if course is None:
        course = db.scalars(select(Course).order_by(Course.id)).first()
    if course is None:
        raise LookupError("No course has been seeded")
    return course


def ordered_nodes(db: Session, course: Course) -> list[Skill]:
    stmt = (
        select(Skill)
        .join(Unit)
        .where(Unit.course_id == course.id)
        .order_by(Unit.position, Skill.position)
        .options(selectinload(Skill.lessons))
    )
    return list(db.scalars(stmt))


def progress_by_skill(db: Session, user: User) -> dict[int, UserSkillProgress]:
    rows = db.scalars(select(UserSkillProgress).where(UserSkillProgress.user_id == user.id))
    return {row.skill_id: row for row in rows}


def node_states(nodes: list[Skill], progress: dict[int, UserSkillProgress]) -> dict[int, str]:
    states: dict[int, str] = {}
    active_found = False
    for node in nodes:
        row = progress.get(node.id)
        if row is not None and row.completed_at is not None:
            states[node.id] = "completed"
        elif not active_found:
            states[node.id] = "active"
            active_found = True
        else:
            states[node.id] = "locked"
    return states


def skill_state(db: Session, user: User, skill: Skill) -> str:
    course = get_course(db, user)
    nodes = ordered_nodes(db, course)
    return node_states(nodes, progress_by_skill(db, user)).get(skill.id, "locked")


def get_or_create_progress(db: Session, user: User, skill: Skill) -> UserSkillProgress:
    row = db.scalars(
        select(UserSkillProgress).where(
            UserSkillProgress.user_id == user.id, UserSkillProgress.skill_id == skill.id
        )
    ).first()
    if row is None:
        row = UserSkillProgress(user_id=user.id, skill_id=skill.id, lessons_completed=0)
        db.add(row)
        db.flush()
    return row


def next_lesson(skill: Skill, progress: UserSkillProgress | None) -> Lesson:
    done = progress.lessons_completed if progress else 0
    index = min(done, len(skill.lessons) - 1)
    return skill.lessons[index]


def complete_lesson(db: Session, user: User, lesson: Lesson, now: datetime) -> UserSkillProgress:
    skill = lesson.skill
    row = get_or_create_progress(db, user, skill)
    if lesson.position >= row.lessons_completed:
        row.lessons_completed = min(len(skill.lessons), lesson.position + 1)
    if row.lessons_completed >= len(skill.lessons) and row.completed_at is None:
        row.completed_at = now
    return row


def build_path(db: Session, user: User) -> dict:
    course = get_course(db, user)
    nodes = ordered_nodes(db, course)
    progress = progress_by_skill(db, user)
    states = node_states(nodes, progress)

    units = []
    for unit in course.units:
        skills = []
        for skill in unit.skills:
            row = progress.get(skill.id)
            skills.append(
                {
                    "id": skill.id,
                    "kind": skill.kind,
                    "title": skill.title,
                    "icon": skill.icon,
                    "position": skill.position,
                    "state": states[skill.id],
                    "lessons_completed": row.lessons_completed if row else 0,
                    "total_lessons": len(skill.lessons),
                    "is_legendary": bool(row and row.is_legendary),
                }
            )
        units.append(
            {
                "id": unit.id,
                "position": unit.position,
                "section": unit.section,
                "title": unit.title,
                "description": unit.description,
                "color": unit.color,
                "has_guidebook": bool(unit.guidebook),
                "completed": all(s["state"] == "completed" for s in skills),
                "skills": skills,
            }
        )

    active = next((sid for sid, state in states.items() if state == "active"), None)
    return {
        "course": {
            "id": course.id,
            "title": course.title,
            "flag": course.flag,
            "learning_language": course.learning_language,
            "from_language": course.from_language,
        },
        "units": units,
        "active_skill_id": active,
    }
