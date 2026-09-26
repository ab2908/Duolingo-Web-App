"use client";

import { useEffect, useState } from "react";
import { SpeakerIcon, TurtleIcon } from "@/components/icons";
import { canSpeak, speak } from "@/lib/speech";
import { sounds } from "@/lib/sound";
import { SpeechBubble, type ExerciseProps } from "./shared";

/**
 * "Write this in English" / "Tap what you hear": build the answer by tapping
 * word tiles. Used tiles leave a grey placeholder in the bank, like Duolingo.
 */
export function WordBank({ exercise, locked, onAnswer }: ExerciseProps) {
  const [picked, setPicked] = useState<number[]>([]);
  const isListen = exercise.type === "listen";
  const byId = new Map(exercise.options.map((o) => [o.id, o]));

  useEffect(() => {
    if (isListen) {
      const t = setTimeout(() => speak(exercise.prompt, exercise.prompt_language), 350);
      return () => clearTimeout(t);
    }
  }, [isListen, exercise.prompt, exercise.prompt_language]);

  const update = (next: number[]) => {
    setPicked(next);
    onAnswer(next.length ? next : null);
  };

  const add = (id: number) => {
    if (locked || picked.includes(id)) return;
    sounds.tap();
    if (exercise.answer_language === "es") speak(byId.get(id)!.text, "es");
    update([...picked, id]);
  };

  const remove = (id: number) => {
    if (locked) return;
    update(picked.filter((p) => p !== id));
  };

  return (
    <div className="flex flex-col gap-6">
      {isListen ? (
        <div className="flex items-center justify-center gap-4 py-2">
          <button
            onClick={() => speak(exercise.prompt, exercise.prompt_language)}
            className="btn btn-blue h-[120px] w-[140px] rounded-2xl"
            aria-label="Play audio"
          >
            <SpeakerIcon size={56} />
          </button>
          <button
            onClick={() => speak(exercise.prompt, exercise.prompt_language, { slow: true })}
            className="btn btn-blue h-[80px] w-[80px] rounded-2xl"
            aria-label="Play slowly"
          >
            <TurtleIcon size={36} />
          </button>
          {!canSpeak() && <p className="text-sm font-bold text-ink-soft">Audio isn&apos;t supported in this browser.</p>}
        </div>
      ) : (
        <SpeechBubble text={exercise.prompt} language={exercise.prompt_language} />
      )}

      {/* Answer lines */}
      <div
        className="flex min-h-[124px] flex-wrap content-start gap-2 py-2"
        style={{ backgroundImage: "linear-gradient(transparent 58px, var(--border) 58px, var(--border) 60px, transparent 60px)", backgroundSize: "100% 62px" }}
      >
        {picked.map((id) => (
          <button key={id} className="tile animate-pop h-[50px] px-4 text-lg font-semibold" onClick={() => remove(id)} disabled={locked}>
            {byId.get(id)?.text}
          </button>
        ))}
      </div>

      {/* Bank */}
      <div className="flex flex-wrap justify-center gap-2">
        {exercise.options.map((o) =>
          picked.includes(o.id) ? (
            <span key={o.id} className="h-[50px] rounded-xl bg-line px-4 text-lg font-semibold text-transparent">
              {o.text}
            </span>
          ) : (
            <button key={o.id} className="tile h-[50px] px-4 text-lg font-semibold" onClick={() => add(o.id)} disabled={locked}>
              {o.text}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
