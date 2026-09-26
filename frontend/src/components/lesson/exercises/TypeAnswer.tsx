"use client";

import { useEffect, useRef, useState } from "react";
import { SpeechBubble, type ExerciseProps } from "./shared";

const SPANISH_CHARS = ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"];

/** Free-text translation; accent buttons help when typing Spanish. */
export function TypeAnswer({ exercise, locked, onAnswer }: ExerciseProps) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const toSpanish = exercise.answer_language === "es";

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const update = (value: string) => {
    setText(value);
    onAnswer(value.trim() ? value : null);
  };

  const insert = (ch: string) => {
    const el = ref.current;
    if (!el) return update(text + ch);
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    update(text.slice(0, start) + ch + text.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + ch.length, start + ch.length);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <SpeechBubble text={exercise.prompt} language={exercise.prompt_language} />
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => update(e.target.value)}
        onKeyDown={(e) => {
          // Enter checks the answer (handled by the player) instead of adding a newline.
          if (e.key === "Enter") e.preventDefault();
        }}
        disabled={locked}
        rows={4}
        spellCheck={false}
        autoCapitalize="off"
        placeholder={toSpanish ? "Type in Spanish" : "Type in English"}
        className="w-full resize-none rounded-2xl border-2 border-line bg-surface-2 p-4 text-lg font-semibold text-ink-strong outline-none placeholder:text-ink-soft focus:border-blue-border"
      />
      {toSpanish && (
        <div className="flex flex-wrap gap-2">
          {SPANISH_CHARS.map((ch) => (
            <button key={ch} className="tile h-10 w-10 text-lg font-bold" onClick={() => insert(ch)} disabled={locked}>
              {ch}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
