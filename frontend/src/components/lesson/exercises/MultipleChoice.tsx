"use client";

import { useEffect, useState } from "react";
import { speak } from "@/lib/speech";
import { sounds } from "@/lib/sound";
import { KeyHint, SpeechBubble, type ExerciseProps } from "./shared";

/**
 * Two layouts: picture cards ("Which one of these is 'the coffee'?") and a
 * list of sentences ("Select the correct meaning"). Number keys select.
 */
export function MultipleChoice({ exercise, locked, onAnswer }: ExerciseProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const withImages = exercise.options.some((o) => o.image);

  const choose = (id: number) => {
    if (locked) return;
    setSelected(id);
    onAnswer(id);
    sounds.tap();
    const option = exercise.options.find((o) => o.id === id);
    if (option && exercise.answer_language === "es") speak(option.text, "es");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const index = Number(e.key) - 1;
      if (index >= 0 && index < exercise.options.length) choose(exercise.options[index].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (withImages) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {exercise.options.map((o, i) => (
          <button
            key={o.id}
            className="tile flex flex-col items-center justify-between gap-2 p-3 sm:p-4"
            data-state={selected === o.id ? "selected" : undefined}
            onClick={() => choose(o.id)}
            disabled={locked}
          >
            <span className="emoji flex flex-1 items-center py-4 text-6xl sm:text-7xl">{o.image}</span>
            <span className="flex w-full items-center justify-between gap-2">
              <span className="flex-1 text-center text-base font-bold sm:text-lg">{o.text}</span>
              <KeyHint n={i + 1} active={selected === o.id} />
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {exercise.prompt && <SpeechBubble text={exercise.prompt} language={exercise.prompt_language} />}
      <div className="flex flex-col gap-3">
        {exercise.options.map((o, i) => (
          <button
            key={o.id}
            className="tile flex items-center gap-4 px-4 py-3.5 text-left text-lg font-semibold"
            data-state={selected === o.id ? "selected" : undefined}
            onClick={() => choose(o.id)}
            disabled={locked}
          >
            <KeyHint n={i + 1} active={selected === o.id} />
            <span className="flex-1">{o.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
