"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAppState } from "@/components/AppState";
import { BoltIcon, DumbbellIcon, FlagES, FlameIcon, GemIcon, HeartIcon } from "@/components/icons";
import { ProgressBar } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { heartCountdown } from "@/lib/format";
import { WeekStrip } from "@/components/WeekStrip";

/** Hover (desktop) / tap (touch) popover used by each stat in the top bar. */
function StatPopover({ trigger, children, align = "center" }: { trigger: ReactNode; children: ReactNode; align?: "center" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className="flex items-center gap-2 rounded-xl px-2 py-2 font-extrabold hover:bg-surface-2"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {trigger}
      </button>
      {open && (
        <div className={`absolute top-full z-40 pt-2 ${align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"}`}>
          <div className="animate-pop w-80 rounded-2xl border-2 border-line bg-surface p-5 shadow-xl">{children}</div>
        </div>
      )}
    </div>
  );
}

export function StatsBar({ compact = false }: { compact?: boolean }) {
  const { me, setMe, toast } = useAppState();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!me) return <div className="h-12" />;

  const refill = async () => {
    try {
      setMe(await api.purchase("heart_refill"));
      toast("Hearts refilled!", "success", <HeartIcon size={22} />);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Purchase failed", "error");
    }
  };

  return (
    <div className={`flex items-center justify-between ${compact ? "gap-1" : "gap-2"}`}>
      <StatPopover trigger={<FlagES size={32} />}>
        <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-ink-soft">My courses</p>
        <div className="flex items-center gap-3 rounded-xl bg-blue-light p-3">
          <FlagES size={36} />
          <span className="font-extrabold text-blue">{me.course.title}</span>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl p-3 text-ink-soft">
          <span className="font-bold">+ Add a new course</span>
          <span className="text-xs font-extrabold uppercase">Soon</span>
        </div>
      </StatPopover>

      <StatPopover
        trigger={
          <>
            <FlameIcon size={24} active={me.streak_extended_today} />
            <span className={me.streak_extended_today ? "text-orange" : "text-ink-soft"}>{me.streak}</span>
          </>
        }
      >
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-ink-strong">{me.streak} day streak</h3>
            <p className="mt-1 text-sm font-semibold text-ink-muted">
              {me.streak_extended_today
                ? "You've practiced today. See you tomorrow!"
                : "Do a lesson today to extend your streak!"}
            </p>
          </div>
          <FlameIcon size={52} active={me.streak_extended_today} className="shrink-0" />
        </div>
        <StreakWeek />
        <div className="mt-4 flex items-center justify-between rounded-xl border-2 border-line p-3 text-sm font-bold">
          <span>🧊 Streak freezes</span>
          <span className="text-blue">{me.streak_freezes} equipped</span>
        </div>
      </StatPopover>

      <StatPopover
        trigger={
          <>
            <BoltIcon size={24} />
            <span className="text-yellow" style={{ color: "#e5a800" }}>
              {me.total_xp}
            </span>
          </>
        }
      >
        <div className="flex items-center gap-4">
          <BoltIcon size={52} className="shrink-0" />
          <div>
            <h3 className="text-xl font-extrabold text-ink-strong">{me.total_xp} total XP</h3>
            <p className="text-sm font-semibold text-ink-muted">
              {me.xp_today >= me.daily_goal_xp ? "Daily goal reached. Nice work!" : "Earn XP by completing lessons and practice."}
            </p>
          </div>
        </div>
        <p className="mb-2 mt-4 text-sm font-extrabold uppercase tracking-wide text-ink-soft">Daily goal</p>
        <div className="relative">
          <ProgressBar value={me.xp_today} max={me.daily_goal_xp} color="var(--orange)" height={20} />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-ink-muted">
            {Math.min(me.xp_today, me.daily_goal_xp)} / {me.daily_goal_xp} XP
          </span>
        </div>
        <Link href="/settings" className="btn btn-outline-blue btn-sm mt-4 w-full">
          Edit daily goal
        </Link>
      </StatPopover>

      <StatPopover
        trigger={
          <>
            <GemIcon size={24} />
            <span className="text-red">{me.gems}</span>
          </>
        }
      >
        <div className="flex items-center gap-4">
          <GemIcon size={56} />
          <div>
            <h3 className="text-xl font-extrabold text-ink-strong">Gems</h3>
            <p className="text-sm font-semibold text-ink-muted">You have {me.gems} gems.</p>
          </div>
        </div>
        <Link href="/shop" className="btn btn-outline-blue btn-sm mt-4 w-full">
          Go to shop
        </Link>
      </StatPopover>

      <StatPopover
        align="right"
        trigger={
          <>
            <HeartIcon size={24} empty={me.hearts === 0} />
            <span className={me.hearts === 0 ? "text-ink-soft" : "text-red"}>{me.hearts}</span>
          </>
        }
      >
        <h3 className="text-center text-xl font-extrabold text-ink-strong">Hearts</h3>
        <div className="my-3 flex justify-center gap-1.5">
          {Array.from({ length: me.max_hearts }, (_, i) => (
            <HeartIcon key={i} size={30} empty={i >= me.hearts} />
          ))}
        </div>
        <p className="text-center text-sm font-bold text-ink-muted">
          {me.hearts >= me.max_hearts ? "You have full hearts" : `Next heart in ${heartCountdown(me)}`}
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <button className="btn btn-outline-blue btn-sm w-full justify-between" disabled={me.hearts >= me.max_hearts} onClick={refill}>
            <span className="flex items-center gap-2">
              <HeartIcon size={18} /> Refill hearts
            </span>
            <span className="flex items-center gap-1 text-red">
              <GemIcon size={16} /> {me.refill_cost}
            </span>
          </button>
          <Link href="/lesson?mode=practice" className="btn btn-outline-blue btn-sm w-full justify-start">
            <DumbbellIcon size={18} /> Practice to earn hearts
          </Link>
        </div>
      </StatPopover>
    </div>
  );
}

function StreakWeek() {
  const [week, setWeek] = useState<{ date: string; active: boolean; is_today: boolean }[] | null>(null);
  useEffect(() => {
    api.profile().then((p) => setWeek(p.streak_week)).catch(() => setWeek([]));
  }, []);
  return week ? <WeekStrip week={week} className="mt-4" /> : <div className="mt-4 h-14" />;
}
