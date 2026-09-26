"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAppState } from "@/components/AppState";
import { ComingSoonBadge, Modal, SectionTitle, Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { applyTheme, getThemePreference, type ThemePreference } from "@/lib/theme";
import type { Me } from "@/lib/types";

const GOALS = [
  { xp: 10, label: "Casual" },
  { xp: 20, label: "Regular" },
  { xp: 30, label: "Serious" },
  { xp: 50, label: "Intense" },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 rounded-full transition-colors ${checked ? "bg-blue" : "bg-line"}`}
    >
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left] ${checked ? "left-7" : "left-1"}`} />
    </button>
  );
}

function Row({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t-2 border-line py-4 first:border-t-0">
      <div>
        <p className="font-extrabold text-ink-strong">{title}</p>
        {subtitle && <p className="text-sm font-semibold text-ink-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { me, setMe, refreshMe, toast } = useAppState();
  const [theme, setTheme] = useState<ThemePreference>("light");
  const [name, setName] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the stored preference after hydration
    setTheme(getThemePreference());
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seed the form once the learner loads
    if (me) setName(me.display_name);
  }, [me]);

  if (!me) return <Spinner />;

  const save = async (patch: Partial<Me>, message = "Saved!") => {
    try {
      setMe(await api.updateSettings(patch));
      toast(message);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't save", "error");
    }
  };

  const travel = async (hours: number) => {
    try {
      await api.timeTravel(hours);
      const updated = await refreshMe();
      toast(`⏩ Jumped ${hours >= 24 ? `${hours / 24} day(s)` : `${hours} hour(s)`} ahead. Streak: ${updated?.streak ?? "?"}, hearts: ${updated?.hearts ?? "?"}`, "info");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Time travel failed", "error");
    }
  };

  const reset = async () => {
    await api.reset();
    setConfirmReset(false);
    await refreshMe();
    toast("Demo data reset", "info");
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-extrabold text-ink-strong">Settings</h1>

      <section>
        <SectionTitle>Profile</SectionTitle>
        <div className="card p-5">
          <label className="text-sm font-extrabold uppercase tracking-wide text-ink-muted" htmlFor="name">
            Name
          </label>
          <div className="mt-2 flex gap-3">
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              className="flex-1 rounded-xl border-2 border-line bg-surface-2 px-4 py-3 font-semibold text-ink-strong outline-none focus:border-blue-border"
            />
            <button className="btn btn-blue btn-sm" disabled={!name.trim() || name === me.display_name} onClick={() => save({ display_name: name })}>
              Save
            </button>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>Preferences</SectionTitle>
        <div className="card px-5">
          <Row title="Sound effects">
            <Toggle label="Sound effects" checked={me.sound_enabled} onChange={(v) => save({ sound_enabled: v })} />
          </Row>
          <Row title="Listening exercises" subtitle="Include “Tap what you hear” exercises">
            <Toggle label="Listening exercises" checked={me.listening_enabled} onChange={(v) => save({ listening_enabled: v })} />
          </Row>
          <Row title="Dark mode">
            <select
              value={theme}
              onChange={(e) => {
                const pref = e.target.value as ThemePreference;
                setTheme(pref);
                applyTheme(pref);
              }}
              className="rounded-xl border-2 border-line bg-surface px-3 py-2 font-bold text-ink-strong"
            >
              <option value="light">Off</option>
              <option value="dark">On</option>
              <option value="system">System default</option>
            </select>
          </Row>
          <Row title="Speaking exercises" subtitle="Speech recognition">
            <ComingSoonBadge />
          </Row>
          <Row title="Notifications">
            <ComingSoonBadge />
          </Row>
        </div>
      </section>

      <section>
        <SectionTitle>Daily goal</SectionTitle>
        <div className="card flex flex-col gap-2 p-3">
          {GOALS.map((g) => (
            <button
              key={g.xp}
              onClick={() => save({ daily_goal_xp: g.xp }, `Daily goal set to ${g.xp} XP`)}
              className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 font-extrabold ${
                me.daily_goal_xp === g.xp ? "border-blue-border bg-blue-light text-blue" : "border-line text-ink-strong hover:bg-surface-2"
              }`}
            >
              <span>{g.label}</span>
              <span className="font-bold">{g.xp} XP per day</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Subscription</SectionTitle>
        <div className="card flex items-center justify-between p-5">
          <p className="font-semibold text-ink-muted">Super Duolingo</p>
          <ComingSoonBadge />
        </div>
      </section>

      <section>
        <SectionTitle>Developer tools</SectionTitle>
        <div className="card flex flex-col gap-4 p-5">
          <p className="font-semibold text-ink-muted">
            Simulate time passing to test streaks, streak freezes and heart regeneration. Current simulated offset:{" "}
            <span className="font-extrabold text-ink-strong">{Math.round(me.time_offset_minutes / 60)}h</span> (today is {me.today}).
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button className="btn btn-outline-blue btn-sm" onClick={() => travel(1)}>
              +1 hour
            </button>
            <button className="btn btn-outline-blue btn-sm" onClick={() => travel(4)}>
              +4 hours
            </button>
            <button className="btn btn-outline-blue btn-sm" onClick={() => travel(24)}>
              +1 day
            </button>
            <button className="btn btn-outline-blue btn-sm" onClick={() => travel(48)}>
              +2 days
            </button>
          </div>
          <button className="btn btn-red btn-sm" onClick={() => setConfirmReset(true)}>
            Reset demo data
          </button>
        </div>
      </section>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)}>
        <h2 className="text-xl font-extrabold text-ink-strong">Reset all progress?</h2>
        <p className="mt-2 font-semibold text-ink-muted">This restores the seeded course, learner and league.</p>
        <div className="mt-5 flex gap-3">
          <button className="btn btn-outline flex-1" onClick={() => setConfirmReset(false)}>
            Cancel
          </button>
          <button className="btn btn-red flex-1" onClick={reset}>
            Reset
          </button>
        </div>
      </Modal>
    </div>
  );
}
