"use client";

import { useEffect, useState } from "react";
import { useAppState } from "@/components/AppState";
import { QuestList } from "@/components/layout/RightRail";
import { Mascot } from "@/components/Mascot";
import { ComingSoonBadge, ErrorState, SectionTitle, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";

function hoursUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / 3_600_000);
}

export default function QuestsPage() {
  const { me } = useAppState();
  const { data: quests, error, reload } = useApi(api.quests);
  // Depends on the viewer's clock, so compute it only in the browser (not at build time).
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the local clock after hydration
    setHoursLeft(hoursUntilMidnight());
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4 rounded-2xl bg-[#a560e8] p-6 text-white" style={{ boxShadow: "0 4px 0 #7f3fbf" }}>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">Complete quests to earn rewards!</h1>
          <p className="mt-2 font-semibold opacity-90">Quests refresh every day at midnight.</p>
        </div>
        <Mascot mood="cheer" size={110} className="shrink-0" />
      </div>

      <section>
        <SectionTitle action={hoursLeft !== null && <span className="font-extrabold text-orange">⏱ {hoursLeft} hours</span>}>Daily Quests</SectionTitle>
        <div className="card p-5">
          {error ? <ErrorState message={error} onRetry={reload} /> : quests ? <QuestList quests={quests} /> : <Spinner />}
        </div>
        {me && (
          <p className="mt-3 text-sm font-bold text-ink-soft">
            Your daily goal is {me.daily_goal_xp} XP. Change it in Settings.
          </p>
        )}
      </section>

      <section>
        <SectionTitle>Monthly challenge</SectionTitle>
        <div className="card flex items-center justify-between p-5">
          <div>
            <p className="font-extrabold text-ink-strong">Earn a monthly badge</p>
            <p className="font-semibold text-ink-muted">Complete 30 quests this month</p>
          </div>
          <ComingSoonBadge />
        </div>
      </section>

      <section>
        <SectionTitle>Friends Quest</SectionTitle>
        <div className="card flex items-center justify-between p-5">
          <div>
            <p className="font-extrabold text-ink-strong">Team up with a friend</p>
            <p className="font-semibold text-ink-muted">Social features aren&apos;t part of this clone yet</p>
          </div>
          <ComingSoonBadge />
        </div>
      </section>
    </div>
  );
}
