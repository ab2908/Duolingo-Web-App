"use client";

import { forwardRef } from "react";
import { ChestIcon, NodeGlyph } from "@/components/icons";
import { UNIT_COLORS } from "@/lib/theme";
import type { PathSkill, UnitColor } from "@/lib/types";

const RING = 98;
const STROKE = 8;

/** Circular progress ring drawn around the active node. */
function ProgressRing({ fraction, color }: { fraction: number; color: string }) {
  const r = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <svg width={RING} height={RING} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[46%] -rotate-90">
      <circle cx={RING / 2} cy={RING / 2} r={r} stroke="var(--locked)" strokeWidth={STROKE} fill="none" />
      <circle
        cx={RING / 2}
        cy={RING / 2}
        r={r}
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - fraction)}
        className="transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  );
}

interface Props {
  skill: PathSkill;
  unitColor: UnitColor;
  onClick: () => void;
  selected: boolean;
}

export const PathNode = forwardRef<HTMLButtonElement, Props>(function PathNode({ skill, unitColor, onClick, selected }, ref) {
  const palette = UNIT_COLORS[unitColor] ?? UNIT_COLORS.green;
  const isActive = skill.state === "active";
  const locked = skill.state === "locked";

  if (skill.kind === "chest") {
    return (
      <button
        ref={ref}
        onClick={onClick}
        aria-label={`Treasure chest (${skill.state})`}
        className={`relative flex h-[80px] w-[90px] items-center justify-center transition-transform active:scale-95 ${isActive ? "animate-hop" : ""}`}
      >
        <ChestIcon size={80} open={skill.state === "completed"} locked={locked} />
      </button>
    );
  }

  const legendary = skill.state === "completed" && skill.is_legendary;
  const fill = locked ? "var(--locked)" : legendary ? "#ffc800" : palette.main;
  const lip = locked ? "var(--locked-dark)" : legendary ? "#e5b400" : palette.dark;
  const iconColor = locked ? "var(--locked-icon)" : "#fff";

  return (
    <div className="relative flex h-[90px] w-[98px] items-center justify-center">
      {isActive && skill.kind === "skill" && (
        <ProgressRing fraction={skill.total_lessons ? skill.lessons_completed / skill.total_lessons : 0} color={palette.main} />
      )}
      {isActive && !selected && (
        <div
          className="animate-bob absolute -top-11 left-1/2 z-10 whitespace-nowrap rounded-xl border-2 border-line bg-surface px-3 py-2 text-[15px] font-extrabold uppercase tracking-wide"
          style={{ color: palette.main }}
        >
          {skill.lessons_completed > 0 ? "Continue" : "Start"}
          <span className="absolute -bottom-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-line bg-surface" />
        </div>
      )}
      <button
        ref={ref}
        onClick={onClick}
        aria-label={`${skill.title} (${skill.state})`}
        className="group relative h-[62px] w-[70px] rounded-[50%] transition-transform active:translate-y-[5px]"
        style={{ background: fill, boxShadow: `0 8px 0 ${lip}` }}
      >
        <span className="absolute inset-0 flex items-center justify-center" style={{ color: iconColor }}>
          <NodeGlyph kind={skill.kind} state={skill.state} legendary={legendary} size={32} />
        </span>
        {/* soft highlight on top of the node */}
        <span className="pointer-events-none absolute left-3 right-3 top-2 h-3 rounded-full bg-white/20" />
      </button>
    </div>
  );
});
