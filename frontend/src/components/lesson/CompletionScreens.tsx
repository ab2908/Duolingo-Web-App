"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AchievementGlyph, BoltIcon, ClockIcon, FlameIcon, HeartIcon, TargetIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { WeekStrip } from "@/components/WeekStrip";
import { ProgressBar } from "@/components/ui";
import { formatDuration } from "@/lib/format";
import { sounds } from "@/lib/sound";
import type { SessionSummary } from "@/lib/types";
import { Confetti } from "./Confetti";

function StatCard({ label, color, icon, value }: { label: string; color: string; icon: ReactNode; value: string }) {
  return (
    <div className="animate-pop flex-1 rounded-2xl border-2 pt-1" style={{ background: color, borderColor: color }}>
      <p className="py-1 text-center text-xs font-extrabold uppercase tracking-wider text-white">{label}</p>
      <div className="flex items-center justify-center gap-2 rounded-xl bg-surface px-2 py-4 text-xl font-extrabold" style={{ color }}>
        {icon}
        {value}
      </div>
    </div>
  );
}

function Screen({ children, onContinue, cta = "Continue" }: { children: ReactNode; onContinue: () => void; cta?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Enter" && onContinue();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onContinue]);
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-[600px] flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">{children}</div>
      <footer className="border-t-2 border-line">
        <div className="mx-auto flex max-w-[1000px] justify-end px-4 py-6 sm:px-10">
          <button className="btn w-full sm:w-[150px]" onClick={onContinue}>
            {cta}
          </button>
        </div>
      </footer>
    </div>
  );
}

function accuracyLabel(accuracy: number) {
  if (accuracy === 100) return "Amazing";
  if (accuracy >= 80) return "Great";
  return "Good";
}

function speedLabel(seconds: number) {
  if (seconds < 90) return "Speedy";
  if (seconds < 240) return "Quick";
  return "Committed";
}

export function LessonCompleteScreen({ summary, onContinue }: { summary: SessionSummary; onContinue: () => void }) {
  useEffect(() => sounds.complete(), []);
  const title =
    summary.mode === "legendary" ? "Legendary!" : summary.mode === "practice" ? "Practice complete!" : summary.mistakes === 0 ? "Perfect lesson!" : "Lesson complete!";

  return (
    <Screen onContinue={onContinue}>
      <Confetti />
      <div className="animate-hop">
        <Mascot mood="cheer" size={180} />
      </div>
      <h1 className="text-3xl font-extrabold text-yellow sm:text-4xl" style={{ color: summary.mode === "legendary" ? "#e5b400" : "var(--yellow)" }}>
        {title}
      </h1>
      {summary.bonus_xp > 0 && <p className="-mt-3 font-bold text-ink-muted">+{summary.bonus_xp} XP bonus for zero mistakes</p>}
      <div className="flex w-full max-w-md gap-3">
        <StatCard label="Total XP" color="#ffc800" icon={<BoltIcon size={24} />} value={String(summary.xp_earned)} />
        <StatCard label={accuracyLabel(summary.accuracy)} color="#58cc02" icon={<TargetIcon size={22} />} value={`${summary.accuracy}%`} />
        <StatCard label={speedLabel(summary.duration_seconds)} color="#1cb0f6" icon={<ClockIcon size={22} />} value={formatDuration(summary.duration_seconds)} />
      </div>
      {summary.hearts_gained > 0 && (
        <p className="animate-pop flex items-center gap-2 text-lg font-extrabold text-red">
          <HeartIcon size={26} /> +{summary.hearts_gained} heart earned
        </p>
      )}
      {summary.skill?.completed && summary.skill.level_up && (
        <p className="animate-pop rounded-2xl bg-green-light px-4 py-2 font-extrabold text-green-dark">
          🎉 You finished “{summary.skill.title}”! The next level is unlocked.
        </p>
      )}
    </Screen>
  );
}

export function StreakScreen({ summary, onContinue }: { summary: SessionSummary; onContinue: () => void }) {
  const [count, setCount] = useState(Math.max(0, summary.streak.count - 1));
  useEffect(() => {
    const t = setTimeout(() => {
      setCount(summary.streak.count);
      sounds.chest();
    }, 600);
    return () => clearTimeout(t);
  }, [summary.streak.count]);

  return (
    <Screen onContinue={onContinue}>
      <div className="animate-flicker">
        <FlameIcon size={150} />
      </div>
      <p key={count} className="animate-pop text-8xl font-black text-orange">
        {count}
      </p>
      <h1 className="-mt-4 text-3xl font-extrabold text-orange">day streak!</h1>
      <WeekStrip week={summary.streak.week} className="w-full max-w-sm" />
      <p className="max-w-sm font-bold text-ink-muted">
        {summary.streak.count === 1 ? "You started a new streak! Practice every day to keep it going." : "You're on fire! Practice each day so your streak won't reset."}
      </p>
    </Screen>
  );
}

export function GoalAndAchievementsScreen({ summary, onContinue }: { summary: SessionSummary; onContinue: () => void }) {
  return (
    <Screen onContinue={onContinue}>
      <Confetti pieces={40} />
      <Mascot mood="happy" size={130} />
      {summary.daily_goal.just_completed && (
        <div className="w-full max-w-md rounded-2xl border-2 border-line p-5">
          <h2 className="text-2xl font-extrabold text-ink-strong">Daily goal reached!</h2>
          <p className="mb-3 mt-1 font-bold text-ink-muted">
            {summary.daily_goal.xp_today} / {summary.daily_goal.goal} XP today
          </p>
          <ProgressBar value={summary.daily_goal.xp_today} max={summary.daily_goal.goal} color="var(--orange)" />
        </div>
      )}
      {summary.new_achievements.length > 0 && (
        <div className="flex w-full max-w-md flex-col gap-3">
          <h2 className="text-2xl font-extrabold text-ink-strong">Achievement unlocked!</h2>
          {summary.new_achievements.map((a) => (
            <div key={a.code} className="animate-pop flex items-center gap-4 rounded-2xl border-2 border-line p-4 text-left">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: ACHIEVEMENT_COLORS[a.color] ?? "#ffc800" }}>
                <AchievementGlyph icon={a.icon} size={36} />
              </span>
              <div>
                <p className="text-lg font-extrabold text-ink-strong">{a.title}</p>
                <p className="font-bold text-ink-muted">Level {a.level}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Screen>
  );
}

export const ACHIEVEMENT_COLORS: Record<string, string> = {
  orange: "#ff9600",
  green: "#58cc02",
  blue: "#1cb0f6",
  red: "#ff4b4b",
  purple: "#ce82ff",
  yellow: "#ffc800",
  gold: "#e5b400",
  teal: "#2bdcc8",
};
