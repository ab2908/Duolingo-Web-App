"use client";

import { ShieldIcon } from "@/components/icons";
import { Avatar, ErrorState, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { LeaderboardEntry } from "@/lib/types";

const LEAGUES = [
  { name: "Bronze", color: "#CD7900" },
  { name: "Silver", color: "#C0C0C0" },
  { name: "Gold", color: "#FFC800" },
  { name: "Sapphire", color: "#1CB0F6" },
  { name: "Ruby", color: "#FF4B4B" },
  { name: "Emerald", color: "#58CC02" },
  { name: "Amethyst", color: "#CE82FF" },
  { name: "Pearl", color: "#FFB0C8" },
  { name: "Obsidian", color: "#4B4B4B" },
  { name: "Diamond", color: "#84D8FF" },
];

const MEDALS = ["#FFC800", "#C0C0C0", "#CD7900"];

function Rank({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: MEDALS[rank - 1] }}>
        {rank}
      </span>
    );
  }
  return <span className="w-9 text-center text-lg font-extrabold text-ink-muted">{rank}</span>;
}

function ZoneDivider({ kind }: { kind: "promotion" | "demotion" }) {
  const promo = kind === "promotion";
  return (
    <div className={`my-2 flex items-center justify-center gap-3 text-sm font-extrabold uppercase tracking-wider ${promo ? "text-green" : "text-red"}`}>
      <span>{promo ? "▲" : "▼"}</span>
      {promo ? "Promotion zone" : "Demotion zone"}
      <span>{promo ? "▲" : "▼"}</span>
    </div>
  );
}

function Row({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl px-4 py-3 ${entry.is_me ? "bg-[var(--blue-light)]" : "hover:bg-surface-2"}`}
    >
      <Rank rank={entry.rank} />
      <Avatar name={entry.display_name} color={entry.avatar_color} size={48} />
      <span className={`flex-1 truncate text-lg font-extrabold ${entry.is_me ? "text-blue" : "text-ink-strong"}`}>
        {entry.display_name}
        {entry.is_me && " (you)"}
      </span>
      <span className="font-bold text-ink-muted">{entry.weekly_xp} XP</span>
    </div>
  );
}

export default function LeaderboardPage() {
  const { data: board, error, reload } = useApi(api.leaderboard);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!board) return <Spinner label="Loading league" />;

  const lastSafe = board.entries.length - board.demotion_zone;

  return (
    <div className="flex flex-col items-center">
      {/* Centred when it fits; scrolls from the current league when it doesn't. */}
      <div className="no-scrollbar w-full overflow-x-auto">
        <div className="mx-auto flex w-max gap-3 px-3 py-2">
          {LEAGUES.map((l, i) => (
            <span key={l.name} className={`shrink-0 ${i === 0 ? "scale-125" : "opacity-40 grayscale"}`} title={`${l.name} League`}>
              <ShieldIcon size={46} color={i === 0 ? l.color : "var(--locked-icon)"} />
            </span>
          ))}
        </div>
      </div>
      <h1 className="mt-4 text-2xl font-extrabold text-ink-strong">{board.league} League</h1>
      <p className="mt-1 font-semibold text-ink-muted">Top {board.promotion_zone} advance to the next league</p>
      <p className="mt-1 font-extrabold text-orange">
        {board.days_left} {board.days_left === 1 ? "day" : "days"} left
      </p>
      <div className="my-5 h-0.5 w-full bg-line" />
      <div className="flex w-full flex-col gap-1">
        {board.entries.map((entry) => (
          <div key={entry.user_id}>
            <Row entry={entry} />
            {entry.rank === board.promotion_zone && <ZoneDivider kind="promotion" />}
            {entry.rank === lastSafe && <ZoneDivider kind="demotion" />}
          </div>
        ))}
      </div>
    </div>
  );
}
