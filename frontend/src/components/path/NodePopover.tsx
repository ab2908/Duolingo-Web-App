"use client";

import Link from "next/link";
import { UNIT_COLORS } from "@/lib/theme";
import type { PathSkill, UnitColor } from "@/lib/types";

/** The speech-bubble card that opens under a path node. */
export function NodePopover({ skill, unitColor }: { skill: PathSkill; unitColor: UnitColor }) {
  const palette = UNIT_COLORS[unitColor] ?? UNIT_COLORS.green;
  const locked = skill.state === "locked";
  const completed = skill.state === "completed";
  const bg = locked ? "var(--surface-2)" : palette.main;

  let subtitle: string;
  if (locked) subtitle = "Complete all levels above to unlock this!";
  else if (skill.kind === "review") subtitle = completed ? "You've reviewed this unit. Review it again anytime!" : "Prove your proficiency with a quick unit review.";
  else if (completed && skill.is_legendary) subtitle = "You reached Legendary! Keep your skills sharp with practice.";
  else if (completed) subtitle = "You completed this level! Practice to strengthen it or go Legendary.";
  else subtitle = `Lesson ${skill.lessons_completed + 1} of ${skill.total_lessons}`;

  const xp = skill.kind === "review" ? 15 : 10;

  return (
    <div className="animate-pop absolute left-1/2 top-full z-30 mt-3 w-[300px] -translate-x-1/2">
      <div className="relative rounded-2xl p-4" style={{ background: bg, border: locked ? "2px solid var(--border)" : undefined }}>
        <span
          className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45"
          style={{ background: bg, borderLeft: locked ? "2px solid var(--border)" : undefined, borderTop: locked ? "2px solid var(--border)" : undefined }}
        />
        <h3 className={`text-lg font-extrabold ${locked ? "text-ink-soft" : "text-white"}`}>{skill.title}</h3>
        <p className={`mb-4 mt-1 font-bold ${locked ? "text-ink-soft" : "text-white/90"}`}>{subtitle}</p>

        {locked && (
          <button className="btn w-full" disabled>
            Locked
          </button>
        )}
        {!locked && !completed && (
          <Link href={`/lesson?skill=${skill.id}`} className="btn btn-white w-full" style={{ ["--btn-accent" as string]: palette.main }}>
            {skill.lessons_completed > 0 ? "Continue" : "Start"} +{xp} XP
          </Link>
        )}
        {completed && (
          <div className="flex flex-col gap-3">
            <Link
              href={skill.kind === "review" ? `/lesson?skill=${skill.id}` : `/lesson?skill=${skill.id}&mode=practice`}
              className="btn btn-white w-full"
              style={{ ["--btn-accent" as string]: palette.main }}
            >
              {skill.kind === "review" ? `Review +${xp} XP` : "Practice +5 XP"}
            </Link>
            {skill.kind === "skill" && !skill.is_legendary && (
              <Link href={`/lesson?skill=${skill.id}&mode=legendary`} className="btn btn-gold w-full">
                Legendary +40 XP
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
