"use client";

import { useEffect, useState } from "react";
import { speak } from "@/lib/speech";
import { sounds } from "@/lib/sound";
import type { ExerciseOption } from "@/lib/types";
import { KeyHint, type ExerciseProps } from "./shared";

type Flash = { ids: number[]; kind: "correct" | "wrong" } | null;

/**
 * Tap a word on each side to pair them. Mismatches shake and reset without
 * costing a heart; once every pair is found the exercise submits itself.
 */
export function MatchPairs({ exercise, locked, onSubmit }: ExerciseProps) {
  const left = exercise.options.filter((o) => o.side === "left");
  const right = exercise.options.filter((o) => o.side === "right");
  const [selected, setSelected] = useState<ExerciseOption | null>(null);
  const [matched, setMatched] = useState<number[][]>([]);
  const [flash, setFlash] = useState<Flash>(null);

  const isDone = (id: number) => matched.some((pair) => pair.includes(id));

  const pick = (option: ExerciseOption) => {
    if (locked || flash || isDone(option.id)) return;
    if (option.side === "left") speak(option.text, "es");
    if (!selected || selected.side === option.side) {
      sounds.tap();
      setSelected(selected?.id === option.id ? null : option);
      return;
    }
    const [l, r] = option.side === "left" ? [option, selected] : [selected, option];
    setSelected(null);
    if (l.pair_key === r.pair_key) {
      sounds.correct();
      const next = [...matched, [l.id, r.id]];
      setFlash({ ids: [l.id, r.id], kind: "correct" });
      setTimeout(() => {
        setFlash(null);
        setMatched(next);
        if (next.length === left.length) onSubmit(next);
      }, 350);
    } else {
      sounds.wrong();
      setFlash({ ids: [l.id, r.id], kind: "wrong" });
      setTimeout(() => setFlash(null), 600);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = e.key === "0" ? 10 : Number(e.key);
      if (!n) return;
      const option = n <= left.length ? left[n - 1] : right[n - left.length - 1];
      if (option) pick(option);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const state = (o: ExerciseOption) => {
    if (flash?.ids.includes(o.id)) return flash.kind;
    if (isDone(o.id)) return "done";
    if (selected?.id === o.id) return "selected";
    return undefined;
  };

  const column = (options: ExerciseOption[], offset: number) => (
    <div className="flex flex-1 flex-col gap-3">
      {options.map((o, i) => (
        <button
          key={o.id}
          className={`tile flex min-h-[58px] items-center gap-3 px-3 py-2 text-base font-semibold sm:text-lg ${state(o) === "wrong" ? "animate-shake" : ""}`}
          data-state={state(o)}
          disabled={locked || isDone(o.id)}
          onClick={() => pick(o)}
        >
          <KeyHint n={(offset + i + 1) % 10} active={state(o) === "selected"} />
          <span className="flex-1 text-center">{o.text}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex gap-4 sm:gap-6">
      {column(left, 0)}
      {column(right, left.length)}
    </div>
  );
}
