"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useAppState } from "@/components/AppState";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { OutOfHeartsModal } from "@/components/lesson/LessonModals";
import { Mascot } from "@/components/Mascot";
import { Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { LessonSession, SessionMode } from "@/lib/types";

function LessonRoute({ skillId, mode }: { skillId: number | null; mode: SessionMode }) {
  const router = useRouter();
  const { me, setMe, toast } = useAppState();
  const [session, setSession] = useState<LessonSession | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const started = useRef(false);

  const start = useCallback(async () => {
    setError(null);
    try {
      setSession(await api.startSession(mode, skillId));
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, "error", "Something went wrong"));
    }
  }, [mode, skillId]);

  useEffect(() => {
    // Guard against React strict-mode double effects creating two sessions.
    if (started.current) return;
    started.current = true;
    void start();
  }, [start]);

  if (session) return <LessonPlayer session={session} />;

  if (error?.code === "out_of_hearts") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <OutOfHeartsModal
          open
          gems={me?.gems ?? 0}
          refillCost={me?.refill_cost ?? 350}
          onRefill={async () => {
            try {
              setMe(await api.purchase("heart_refill"));
              void start();
            } catch (e) {
              toast(e instanceof ApiError ? e.message : "Couldn't refill", "error");
            }
          }}
          onPractice={() => router.replace("/lesson?mode=practice")}
          onQuit={() => router.push("/learn")}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Mascot mood="sad" size={140} />
        <h1 className="text-2xl font-extrabold text-ink-strong">{error.message}</h1>
        <Link href="/learn" className="btn btn-blue">
          Back to learning
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner label={mode === "practice" ? "Building your practice" : "Loading lesson"} />
    </div>
  );
}

function LessonPageInner() {
  const params = useSearchParams();
  const skill = params.get("skill");
  const mode = (params.get("mode") as SessionMode) || "lesson";
  // Re-mount when the query changes (e.g. "practice to earn hearts").
  return <LessonRoute key={params.toString()} skillId={skill ? Number(skill) : null} mode={mode} />;
}

export default function LessonPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LessonPageInner />
    </Suspense>
  );
}
