"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ACHIEVEMENT_COLORS } from "@/components/lesson/CompletionScreens";
import { AchievementGlyph, BoltIcon, BookIcon, FlagES, FlameIcon, GearIcon, ShieldIcon } from "@/components/icons";
import { Avatar, ComingSoonBadge, ErrorState, ProgressBar, SectionTitle, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { joinedLabel, weekdayLetter } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { Profile } from "@/lib/types";

function Stat({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: string }) {
  return (
    <div className="card flex items-center gap-3 px-4 py-3">
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-xl font-extrabold text-ink-strong">{value}</p>
        <p className="truncate text-sm font-semibold text-ink-muted">{label}</p>
      </div>
    </div>
  );
}

function XpChart({ days }: { days: Profile["xp_last_7_days"] }) {
  const max = Math.max(20, ...days.map((d) => d.xp));
  return (
    <div className="card p-5">
      <div className="flex h-44 items-end justify-between gap-2">
        {days.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-xs font-extrabold text-ink-muted">{d.xp || ""}</span>
            <div
              className="w-full max-w-[36px] rounded-t-lg bg-orange transition-[height] duration-700"
              style={{ height: `${(d.xp / max) * 120}px`, minHeight: d.xp ? 6 : 2, opacity: d.xp ? 1 : 0.25 }}
            />
            <span className="text-xs font-extrabold text-ink-soft">{weekdayLetter(d.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: profile, error, reload } = useApi(api.profile);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!profile) return <Spinner label="Loading profile" />;
  const { me } = profile;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-4 border-b-2 border-line pb-8 sm:flex-row sm:items-start">
        <Avatar name={me.display_name} color={me.avatar_color} size={120} />
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-ink-strong">{me.display_name}</h1>
          <p className="font-semibold text-ink-muted">@{me.username}</p>
          <p className="mt-3 font-semibold text-ink-muted">🕒 Joined {joinedLabel(me.created_at)}</p>
          <div className="mt-3 flex items-center justify-center gap-2 sm:justify-start">
            <FlagES size={28} />
            <span className="font-bold text-ink-muted">Learning {me.course.title}</span>
          </div>
        </div>
        <Link href="/settings" className="btn btn-outline-blue btn-sm" aria-label="Settings">
          <GearIcon size={20} /> Edit
        </Link>
      </div>

      <section>
        <SectionTitle>Statistics</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={<FlameIcon size={30} active={me.streak > 0} />} value={me.streak} label="Day streak" />
          <Stat icon={<BoltIcon size={30} />} value={me.total_xp} label="Total XP" />
          <Stat icon={<ShieldIcon size={30} color="#CD7900" />} value={profile.league} label="Current league" />
          <Stat icon={<BookIcon size={30} color="#1cb0f6" />} value={profile.words_learned} label="Words learned" />
          <Stat icon={<span className="text-2xl">🏆</span>} value={profile.lessons_completed} label="Lessons completed" />
          <Stat icon={<FlameIcon size={30} />} value={me.longest_streak} label="Longest streak" />
        </div>
      </section>

      <section>
        <SectionTitle>XP this week</SectionTitle>
        <XpChart days={profile.xp_last_7_days} />
      </section>

      <section>
        <SectionTitle>Achievements</SectionTitle>
        <div className="card divide-y-2 divide-[var(--border)]">
          {profile.achievements.map((a) => {
            const color = ACHIEVEMENT_COLORS[a.color] ?? "#ffc800";
            const earned = a.level > 0;
            return (
              <div key={a.code} className="flex items-center gap-4 p-4">
                <div
                  className="relative flex h-[84px] w-[70px] shrink-0 flex-col items-center justify-center rounded-2xl"
                  style={{ background: earned ? color : "var(--locked)", boxShadow: `0 4px 0 ${earned ? "rgba(0,0,0,.18)" : "var(--locked-dark)"}` }}
                >
                  <span className={earned ? "" : "opacity-40 grayscale"}>
                    <AchievementGlyph icon={a.icon} size={38} />
                  </span>
                  <span className="absolute bottom-1 text-[11px] font-black uppercase text-white">
                    {earned ? `Level ${a.level}` : "Locked"}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-ink-strong">{a.title}</h3>
                    <span className="text-sm font-bold text-ink-muted">
                      {a.progress}/{a.goal}
                    </span>
                  </div>
                  <ProgressBar value={a.progress} max={a.goal} color="var(--yellow)" className="my-2" />
                  <p className="font-semibold text-ink-muted">{a.level >= a.max_level ? "Max level reached!" : a.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle>Friends</SectionTitle>
        <div className="card flex items-center justify-between p-5">
          <p className="font-semibold text-ink-muted">Follow friends and compete together</p>
          <ComingSoonBadge />
        </div>
      </section>
    </div>
  );
}
