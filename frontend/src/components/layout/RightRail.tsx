"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppState } from "@/components/AppState";
import { ChestIcon, ShieldIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { ComingSoonBadge, Modal, ProgressBar } from "@/components/ui";
import { api } from "@/lib/api";
import type { Leaderboard, Quest } from "@/lib/types";
import { StatsBar } from "./StatsBar";
import { QuestIcon } from "@/components/QuestIcon";

export function SuperCard() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="card relative overflow-hidden p-5">
        <div className="absolute right-3 top-3 rounded-lg bg-gradient-to-r from-[#26ff55] via-[#1cb0f6] to-[#ce82ff] px-2 py-0.5 text-xs font-black uppercase text-white">
          Super
        </div>
        <h3 className="text-lg font-extrabold text-ink-strong">Try Super for free</h3>
        <p className="mt-1 max-w-[190px] text-sm font-semibold text-ink-muted">No ads, personalized practice, and unlimited Legendary!</p>
        <Mascot mood="wink" size={70} className="absolute bottom-2 right-3" />
        <button className="btn btn-sm mt-4 w-[190px] bg-gradient-to-r from-[#8c4dff] to-[#1cb0f6] [--btn-lip:#5a2fb3]" onClick={() => setOpen(true)}>
          Try 2 weeks free
        </button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col items-center gap-3 text-center">
          <Mascot mood="cheer" size={110} />
          <h2 className="text-2xl font-extrabold text-ink-strong">Super is coming soon</h2>
          <p className="font-semibold text-ink-muted">Subscriptions and in-app purchases aren&apos;t part of this clone. Gems are free to spend!</p>
          <ComingSoonBadge />
          <button className="btn btn-blue mt-2 w-full" onClick={() => setOpen(false)}>
            Got it
          </button>
        </div>
      </Modal>
    </>
  );
}

function LeagueCard() {
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const { me } = useAppState();
  useEffect(() => {
    api.leaderboard().then(setBoard).catch(() => {});
  }, [me?.total_xp]);
  const mine = board?.entries.find((e) => e.is_me);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-ink-strong">{board?.league ?? "Bronze"} League</h3>
        <Link href="/leaderboard" className="text-sm font-extrabold uppercase tracking-wide text-blue hover:brightness-110">
          View league
        </Link>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <ShieldIcon size={48} color="#CD7900" />
        <p className="font-semibold text-ink-muted">
          {mine ? (
            <>
              You&apos;re ranked <span className="font-extrabold text-ink-strong">#{mine.rank}</span> with{" "}
              <span className="font-extrabold text-ink-strong">{mine.weekly_xp} XP</span> this week
            </>
          ) : (
            "Complete lessons to climb the league!"
          )}
        </p>
      </div>
    </div>
  );
}

export function QuestList({ quests }: { quests: Quest[] }) {
  return (
    <div className="flex flex-col gap-5">
      {quests.map((q) => (
        <div key={q.code} className="flex items-center gap-4">
          <QuestIcon icon={q.icon} />
          <div className="flex-1">
            <p className="mb-2 font-extrabold text-ink-strong">{q.title}</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <ProgressBar value={q.progress} max={q.goal} color="var(--yellow)" height={18} />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-ink-muted">
                  {q.progress} / {q.goal}
                </span>
              </div>
              <ChestIcon size={30} open={q.completed} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function QuestsCard() {
  const { me } = useAppState();
  const [quests, setQuests] = useState<Quest[] | null>(null);
  useEffect(() => {
    api.quests().then(setQuests).catch(() => {});
  }, [me?.xp_today, me?.daily_goal_xp]);

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-ink-strong">Daily Quests</h3>
        <Link href="/quests" className="text-sm font-extrabold uppercase tracking-wide text-blue hover:brightness-110">
          View all
        </Link>
      </div>
      {quests ? <QuestList quests={quests} /> : <div className="h-40" />}
    </div>
  );
}

export function RightRail() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[368px] shrink-0 flex-col lg:flex">
      {/* The stats bar sits outside the scrolling area so its popovers aren't clipped. */}
      <div className="relative z-20 px-6 pb-2 pt-6">
        <StatsBar />
      </div>
      {/* shrink-0 on the cards: let the area scroll rather than squashing them to fit. */}
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pb-6 pt-3 [&>*]:shrink-0">
        <SuperCard />
        <LeagueCard />
        <QuestsCard />
        <footer className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-4 pb-4 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
          <span>About</span>
          <span>Blog</span>
          <span>Store</span>
          <span>Efficacy</span>
          <span>Careers</span>
          <span>Terms</span>
          <span>Privacy</span>
        </footer>
      </div>
    </aside>
  );
}
