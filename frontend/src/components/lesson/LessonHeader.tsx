"use client";

import { useEffect, useRef, useState } from "react";
import { ClockIcon, CloseIcon, CrownIcon, HeartIcon } from "@/components/icons";
import { ProgressBar } from "@/components/ui";
import { formatDuration } from "@/lib/format";
import type { SessionMode } from "@/lib/types";

interface Props {
  progress: number;
  total: number;
  hearts: number;
  mode: SessionMode;
  mistakes: number;
  maxMistakes: number | null;
  combo: number;
  secondsLeft: number | null;
  onClose: () => void;
}

export function LessonHeader({ progress, total, hearts, mode, mistakes, maxMistakes, combo, secondsLeft, onClose }: Props) {
  const [pulse, setPulse] = useState(false);
  const prevHearts = useRef(hearts);
  useEffect(() => {
    if (hearts < prevHearts.current) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 500);
      prevHearts.current = hearts;
      return () => clearTimeout(t);
    }
    prevHearts.current = hearts;
  }, [hearts]);

  return (
    <header className="mx-auto flex w-full max-w-[1000px] items-center gap-4 px-4 pt-6 sm:px-10 sm:pt-12">
      <button onClick={onClose} className="text-ink-soft transition-colors hover:text-ink-muted" aria-label="Quit lesson">
        <CloseIcon size={26} />
      </button>
      <div className="relative flex-1">
        {combo >= 3 && (
          <span key={combo} className="animate-pop absolute -top-6 left-3 text-sm font-extrabold uppercase tracking-wide text-orange">
            {combo} in a row
          </span>
        )}
        <ProgressBar value={progress} max={total} color={mode === "legendary" ? "var(--yellow)" : "var(--green)"} />
      </div>
      {secondsLeft !== null && (
        <span className={`flex items-center gap-1.5 font-extrabold ${secondsLeft <= 20 ? "text-red" : "text-blue"}`}>
          <ClockIcon size={24} /> {formatDuration(Math.max(0, secondsLeft))}
        </span>
      )}
      {mode === "lesson" && (
        <span className={`flex items-center gap-2 text-lg font-extrabold ${hearts > 0 ? "text-red" : "text-ink-soft"}`}>
          <span className={pulse ? "animate-heart" : ""}>
            <HeartIcon size={28} empty={hearts === 0} />
          </span>
          {hearts}
        </span>
      )}
      {mode === "practice" && (
        <span className="flex items-center gap-2 text-lg font-extrabold text-red">
          <HeartIcon size={28} /> ∞
        </span>
      )}
      {mode === "legendary" && maxMistakes !== null && (
        <span className="flex items-center gap-2 text-lg font-extrabold text-yellow">
          <CrownIcon size={28} /> {maxMistakes - mistakes}
        </span>
      )}
    </header>
  );
}
