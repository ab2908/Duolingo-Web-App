"use client";

import { SpeakerIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { speak } from "@/lib/speech";
import type { Answer, Exercise } from "@/lib/types";

export interface ExerciseProps {
  exercise: Exercise;
  /** True once the answer has been checked: inputs freeze. */
  locked: boolean;
  /** Report the current answer (null = nothing selected yet, CHECK disabled). */
  onAnswer: (answer: Answer | null) => void;
  /** Submit immediately (used by match pairs, which has no CHECK button). */
  onSubmit: (answer: Answer) => void;
}

/** Mascot with a speech bubble holding the prompt sentence (tap to hear it). */
export function SpeechBubble({ text, language }: { text: string; language: string }) {
  const canHear = language === "es";
  return (
    <div className="flex items-end gap-3">
      <Mascot size={96} className="shrink-0" />
      <div className="relative mb-8 rounded-2xl border-2 border-line px-4 py-3 text-lg font-semibold text-ink-strong">
        <span className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2 border-line bg-surface" />
        <div className="flex items-center gap-3">
          {canHear && (
            <button onClick={() => speak(text, language)} className="text-blue hover:brightness-110" aria-label="Play audio">
              <SpeakerIcon size={26} />
            </button>
          )}
          <button
            onClick={() => canHear && speak(text, language)}
            className={`text-left ${canHear ? "decoration-line decoration-2 underline-offset-[6px] [text-decoration-style:dashed] hover:underline" : "cursor-default"}`}
          >
            {text}
          </button>
        </div>
      </div>
    </div>
  );
}

export function KeyHint({ n, active }: { n: number | string; active?: boolean }) {
  return (
    <span
      className={`hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold sm:flex ${
        active ? "border-blue-border text-blue" : "border-line text-ink-soft"
      }`}
    >
      {n}
    </span>
  );
}
