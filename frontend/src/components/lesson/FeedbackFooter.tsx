"use client";

import { CheckIcon, CloseIcon } from "@/components/icons";
import type { AnswerResult, ExerciseType } from "@/lib/types";

const PRAISE = ["Nice!", "Great job!", "Amazing!", "Excellent!", "Awesome!", "Correct!"];

interface Props {
  phase: "answering" | "checking" | "feedback";
  canCheck: boolean;
  result: AnswerResult | null;
  exerciseType: ExerciseType | null;
  praiseSeed: number;
  onCheck: () => void;
  onSkip: () => void;
  onContinue: () => void;
  onCantListen?: () => void;
}

/** Bottom bar: SKIP/CHECK while answering, then the green or red feedback banner. */
export function FeedbackFooter({ phase, canCheck, result, exerciseType, praiseSeed, onCheck, onSkip, onContinue, onCantListen }: Props) {
  const showFeedback = phase === "feedback" && result;
  const good = result?.correct;

  return (
    <footer
      className={`border-t-2 transition-colors ${
        showFeedback ? (good ? "border-transparent bg-[var(--feedback-good)]" : "border-transparent bg-[var(--feedback-bad)]") : "border-line"
      }`}
    >
      <div className="mx-auto flex min-h-[140px] max-w-[1000px] flex-col justify-center gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        {showFeedback ? (
          <>
            <div className="animate-slide-up flex items-center gap-4">
              <span
                className={`hidden h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white sm:flex ${good ? "text-green" : "text-red"}`}
              >
                {good ? <CheckIcon size={40} /> : <CloseIcon size={36} />}
              </span>
              <div className={good ? "text-green-text" : "text-red-text"}>
                <h3 className="text-2xl font-extrabold">{good ? PRAISE[praiseSeed % PRAISE.length] : "Correct solution:"}</h3>
                {!good && <p className="mt-1 text-lg font-semibold">{result.solution}</p>}
                {result.note && <p className="mt-1 font-bold">{result.note}</p>}
              </div>
            </div>
            <button className={`btn w-full sm:w-[150px] ${good ? "" : "btn-red"}`} onClick={onContinue} autoFocus>
              Continue
            </button>
          </>
        ) : (
          <>
            <div className="hidden gap-3 sm:flex">
              {exerciseType === "listen" && onCantListen ? (
                <button className="btn btn-outline w-[180px]" onClick={onCantListen} disabled={phase !== "answering"}>
                  Can&apos;t listen now
                </button>
              ) : exerciseType !== "match_pairs" ? (
                <button className="btn btn-outline w-[150px]" onClick={onSkip} disabled={phase !== "answering"}>
                  Skip
                </button>
              ) : null}
            </div>
            <button className="btn w-full sm:w-[150px]" onClick={onCheck} disabled={!canCheck || phase !== "answering"}>
              {phase === "checking" ? "Checking…" : "Check"}
            </button>
          </>
        )}
      </div>
    </footer>
  );
}
