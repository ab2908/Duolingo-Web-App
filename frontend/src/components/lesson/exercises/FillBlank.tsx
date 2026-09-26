"use client";

import { useEffect, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { speak } from "@/lib/speech";
import { sounds } from "@/lib/sound";
import { KeyHint, type ExerciseProps } from "./shared";

/** A Spanish sentence with a gap; pick the word that completes it. */
export function FillBlank({ exercise, locked, onAnswer }: ExerciseProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [before, after] = exercise.prompt.split("___");
  const chosen = exercise.options.find((o) => o.id === selected);

  const choose = (id: number) => {
    if (locked) return;
    const next = selected === id ? null : id;
    setSelected(next);
    onAnswer(next);
    sounds.tap();
    const option = exercise.options.find((o) => o.id === id);
    if (next && option) speak(option.text, "es");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const index = Number(e.key) - 1;
      if (index >= 0 && index < exercise.options.length) choose(exercise.options[index].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Mascot size={88} className="shrink-0" />
        <div>
          <p className="flex flex-wrap items-end gap-x-2 gap-y-3 text-2xl font-semibold text-ink-strong">
            <span>{before}</span>
            <span
              className={`inline-flex min-w-[90px] justify-center border-b-2 px-2 pb-1 ${chosen ? "border-blue text-blue" : "border-ink-soft text-transparent"}`}
            >
              {chosen?.text ?? "____"}
            </span>
            <span>{after}</span>
          </p>
          {exercise.hint && <p className="mt-3 font-semibold text-ink-muted">{exercise.hint}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {exercise.options.map((o, i) => (
          <button
            key={o.id}
            className="tile flex items-center gap-4 px-4 py-3.5 text-lg font-semibold"
            data-state={selected === o.id ? "selected" : undefined}
            onClick={() => choose(o.id)}
            disabled={locked}
          >
            <KeyHint n={i + 1} active={selected === o.id} />
            <span className="flex-1 text-center sm:text-left">{o.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
