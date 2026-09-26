"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppState } from "@/components/AppState";
import { api, ApiError } from "@/lib/api";
import { sounds } from "@/lib/sound";
import type { Answer, AnswerResult, Exercise, LessonSession, SessionSummary } from "@/lib/types";
import { GoalAndAchievementsScreen, LessonCompleteScreen, StreakScreen } from "./CompletionScreens";
import { FillBlank } from "./exercises/FillBlank";
import { MatchPairs } from "./exercises/MatchPairs";
import { MultipleChoice } from "./exercises/MultipleChoice";
import type { ExerciseProps } from "./exercises/shared";
import { TypeAnswer } from "./exercises/TypeAnswer";
import { WordBank } from "./exercises/WordBank";
import { FeedbackFooter } from "./FeedbackFooter";
import { LessonHeader } from "./LessonHeader";
import { LegendaryFailedModal, OutOfHeartsModal, QuitModal } from "./LessonModals";

type Phase = "answering" | "checking" | "feedback";
type Screen = "lesson" | "complete" | "streak" | "extras";
type ModalKind = null | "quit" | "hearts" | "legendary";

function ExerciseView(props: ExerciseProps) {
  switch (props.exercise.type) {
    case "multiple_choice":
      return <MultipleChoice {...props} />;
    case "translate":
    case "listen":
      return <WordBank {...props} />;
    case "match_pairs":
      return <MatchPairs {...props} />;
    case "fill_blank":
      return <FillBlank {...props} />;
    case "type_answer":
      return <TypeAnswer {...props} />;
  }
}

/**
 * Runs one session. Exercises answered wrong go to the back of the queue
 * (shown again as "Previous mistake"), so a lesson ends only when every
 * exercise has been answered correctly; the progress bar counts those.
 */
export function LessonPlayer({ session }: { session: LessonSession }) {
  const router = useRouter();
  const { me, refreshMe, setMe, toast } = useAppState();
  const exercises = session.exercises;

  const [queue, setQueue] = useState<number[]>(() => exercises.map((_, i) => i));
  const [solved, setSolved] = useState(0);
  const [retryIds, setRetryIds] = useState<Set<number>>(() => new Set());
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [phase, setPhase] = useState<Phase>("answering");
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [hearts, setHearts] = useState(session.hearts);
  const [mistakes, setMistakes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [modal, setModal] = useState<ModalKind>(null);
  const [failReason, setFailReason] = useState("");
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [screen, setScreen] = useState<Screen>("lesson");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(session.time_limit_seconds);
  const finishing = useRef(false);

  const current: Exercise | null = queue.length ? exercises[queue[0]] : null;

  const exit = useCallback(async () => {
    await refreshMe();
    router.push("/learn");
  }, [refreshMe, router]);

  const abandonAndGo = useCallback(
    async (href: string) => {
      try {
        await api.abandon(session.id);
      } catch {
        // leaving anyway
      }
      await refreshMe();
      router.replace(href);
    },
    [refreshMe, router, session.id],
  );

  const failLegendary = useCallback(
    (reason: string) => {
      setFailReason(reason);
      setModal("legendary");
      void api.abandon(session.id).catch(() => {});
    },
    [session.id],
  );

  const finish = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    try {
      const res = await api.complete(session.id);
      setSummary(res);
      setScreen("complete");
      void refreshMe();
    } catch (e) {
      if (e instanceof ApiError && e.code === "time_up") failLegendary("Time's up!");
      else toast(e instanceof ApiError ? e.message : "Couldn't save your progress", "error");
      finishing.current = false;
    }
  }, [failLegendary, refreshMe, session.id, toast]);

  const submit = useCallback(
    async (value: Answer | null) => {
      if (!current || phase !== "answering") return;
      setPhase("checking");
      try {
        const res = await api.answer(session.id, current.id, value);
        setResult(res);
        setHearts(res.hearts);
        setMistakes(res.mistakes);
        if (res.correct) {
          sounds.correct();
          setCombo((c) => c + 1);
        } else {
          sounds.wrong();
          setCombo(0);
        }
        setPhase("feedback");
      } catch (e) {
        setPhase("answering");
        if (e instanceof ApiError && e.code === "out_of_hearts") setModal("hearts");
        else toast(e instanceof ApiError ? e.message : "Something went wrong", "error");
      }
    },
    [current, phase, session.id, toast],
  );

  const advance = useCallback(() => {
    if (!result || !current) return;
    if (session.mode === "legendary" && result.session_status === "failed") {
      failLegendary(`You made ${session.max_mistakes} mistakes.`);
      return;
    }
    const [head, ...rest] = queue;
    const nextQueue = result.correct ? rest : [...rest, head];
    if (result.correct) setSolved((s) => s + 1);
    else setRetryIds((ids) => new Set(ids).add(current.id));
    setQueue(nextQueue);
    setResult(null);
    setAnswer(null);
    setPhase("answering");
    setAttempt((a) => a + 1);
    if (session.mode === "lesson" && !result.correct && result.hearts === 0) setModal("hearts");
    if (nextQueue.length === 0) void finish();
  }, [current, failLegendary, finish, queue, result, session.max_mistakes, session.mode]);

  const cantListen = useCallback(async () => {
    if (!current) return;
    try {
      await api.skipListening(session.id, current.id);
      toast("Listening exercises are off. Turn them back on in Settings.", "info");
      const [, ...rest] = queue;
      setSolved((s) => s + 1);
      setQueue(rest);
      setAnswer(null);
      setAttempt((a) => a + 1);
      if (rest.length === 0) void finish();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Something went wrong", "error");
    }
  }, [current, finish, queue, session.id, toast]);

  // Enter = CHECK / CONTINUE. Captured so a focused tile doesn't also get "clicked".
  useEffect(() => {
    if (screen !== "lesson") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || modal) return;
      e.preventDefault();
      if (phase === "feedback") advance();
      else if (phase === "answering" && answer !== null) void submit(answer);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [advance, answer, modal, phase, screen, submit]);

  // Legendary countdown.
  useEffect(() => {
    if (secondsLeft === null || screen !== "lesson" || modal === "legendary") return;
    if (secondsLeft <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- timer expiry is an external event
      failLegendary("Time's up!");
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? s : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [failLegendary, modal, screen, secondsLeft]);

  const refill = async () => {
    try {
      const updated = await api.purchase("heart_refill");
      setMe(updated);
      setHearts(updated.hearts);
      setModal(null);
      toast("Hearts refilled! Keep going!");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't refill hearts", "error");
    }
  };

  // --- Post-lesson screens --------------------------------------------------
  if (summary && screen !== "lesson") {
    const afterStreak = () =>
      summary.daily_goal.just_completed || summary.new_achievements.length ? setScreen("extras") : void exit();
    if (screen === "complete")
      return <LessonCompleteScreen summary={summary} onContinue={() => (summary.streak.extended ? setScreen("streak") : afterStreak())} />;
    if (screen === "streak") return <StreakScreen summary={summary} onContinue={afterStreak} />;
    return <GoalAndAchievementsScreen summary={summary} onContinue={() => void exit()} />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <LessonHeader
        progress={solved}
        total={exercises.length}
        hearts={hearts}
        mode={session.mode}
        mistakes={mistakes}
        maxMistakes={session.max_mistakes}
        combo={combo}
        secondsLeft={secondsLeft}
        onClose={() => setModal("quit")}
      />

      <main className="mx-auto flex w-full max-w-[600px] flex-1 flex-col justify-center px-4 py-8 sm:py-12">
        {current ? (
          <div key={`${current.id}-${attempt}`} className="animate-fade flex flex-col gap-6">
            {retryIds.has(current.id) && (
              <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-orange">↻ Previous mistake</p>
            )}
            {session.mode === "legendary" && attempt === 0 && (
              <p className="text-sm font-extrabold uppercase tracking-wide text-yellow" style={{ color: "#e5b400" }}>
                Legendary challenge
              </p>
            )}
            <h1 className="text-2xl font-extrabold text-ink-strong sm:text-[32px] sm:leading-tight">{current.instruction}</h1>
            <ExerciseView exercise={current} locked={phase !== "answering"} onAnswer={setAnswer} onSubmit={(value) => void submit(value)} />
          </div>
        ) : (
          <p className="text-center text-xl font-extrabold text-ink-soft">Saving your progress…</p>
        )}
      </main>

      <FeedbackFooter
        phase={phase}
        canCheck={answer !== null}
        result={result}
        exerciseType={current?.type ?? null}
        praiseSeed={solved + attempt}
        onCheck={() => void submit(answer)}
        onSkip={() => void submit(null)}
        onContinue={advance}
        onCantListen={cantListen}
      />

      <QuitModal open={modal === "quit"} onStay={() => setModal(null)} onQuit={() => void abandonAndGo("/learn")} />
      <OutOfHeartsModal
        open={modal === "hearts"}
        gems={me?.gems ?? 0}
        refillCost={me?.refill_cost ?? 350}
        onRefill={() => void refill()}
        onPractice={() => void abandonAndGo("/lesson?mode=practice")}
        onQuit={() => void abandonAndGo("/learn")}
      />
      <LegendaryFailedModal open={modal === "legendary"} reason={failReason} onQuit={() => void exit()} />
    </div>
  );
}
