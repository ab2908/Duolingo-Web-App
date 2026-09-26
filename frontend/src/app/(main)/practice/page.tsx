"use client";

import Link from "next/link";
import { CrownIcon, DumbbellIcon, HeartIcon, SpeakerIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { ComingSoonBadge, ErrorState, SectionTitle, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";

export default function PracticeHubPage() {
  const { data: path, error, reload } = useApi(api.path);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!path) return <Spinner />;

  const completed = path.units.flatMap((u) => u.skills.filter((s) => s.kind === "skill" && s.state === "completed").map((s) => ({ ...s, unit: u })));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4 rounded-2xl bg-[#2bdcc8] p-6 text-white" style={{ boxShadow: "0 4px 0 #1fb3a3" }}>
        <div className="flex-1">
          <p className="text-sm font-extrabold uppercase tracking-wider opacity-90">Practice hub</p>
          <h1 className="mt-1 text-2xl font-extrabold">Review what you&apos;ve learned</h1>
          <p className="mt-1 font-semibold opacity-90">Practice never costs hearts, and every session earns one back.</p>
        </div>
        <Mascot mood="happy" size={100} className="hidden shrink-0 sm:block" />
      </div>

      <Link href="/lesson?mode=practice" className="card flex items-center gap-4 p-5 transition-colors hover:bg-surface-2">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue text-white">
          <DumbbellIcon size={34} />
        </span>
        <div className="flex-1">
          <h2 className="text-lg font-extrabold text-ink-strong">Mixed practice</h2>
          <p className="font-semibold text-ink-muted">A quick review of everything you&apos;ve finished</p>
        </div>
        <span className="flex items-center gap-1 font-extrabold text-red">
          +1 <HeartIcon size={22} />
        </span>
      </Link>

      <section>
        <SectionTitle>Legendary challenges</SectionTitle>
        {completed.length === 0 ? (
          <p className="card p-5 font-semibold text-ink-muted">Complete a skill on the path to unlock its Legendary challenge.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {completed.map((s) => (
              <Link
                key={s.id}
                href={s.is_legendary ? `/lesson?skill=${s.id}&mode=practice` : `/lesson?skill=${s.id}&mode=legendary`}
                className="card flex items-center gap-4 p-4 transition-colors hover:bg-surface-2"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: s.is_legendary ? "#ffc800" : "var(--locked)" }}>
                  <CrownIcon size={28} />
                </span>
                <div>
                  <p className="font-extrabold text-ink-strong">{s.title}</p>
                  <p className="text-sm font-bold text-ink-muted">{s.is_legendary ? "Legendary ✓ · practice" : "3 mistakes, 3 minutes · +40 XP"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>More ways to practice</SectionTitle>
        <div className="flex flex-col gap-3">
          {[
            { title: "Speaking practice", text: "Pronunciation with speech recognition" },
            { title: "Stories", text: "Short interactive stories with audio" },
          ].map((item) => (
            <div key={item.title} className="card flex items-center gap-4 p-4 opacity-80">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-soft">
                <SpeakerIcon size={26} />
              </span>
              <div className="flex-1">
                <p className="font-extrabold text-ink-strong">{item.title}</p>
                <p className="text-sm font-semibold text-ink-muted">{item.text}</p>
              </div>
              <ComingSoonBadge />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
