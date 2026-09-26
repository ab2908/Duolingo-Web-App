"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import { syncServerClock } from "@/lib/format";
import { setSoundEnabled } from "@/lib/sound";
import type { Me } from "@/lib/types";

type ToastTone = "success" | "info" | "error";
interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  icon?: ReactNode;
}

interface AppState {
  me: Me | null;
  meError: string | null;
  refreshMe: () => Promise<Me | null>;
  setMe: (me: Me) => void;
  toast: (message: string, tone?: ToastTone, icon?: ReactNode) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [me, setMeState] = useState<Me | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const setMe = useCallback((value: Me) => {
    setMeState(value);
    setSoundEnabled(value.sound_enabled);
    syncServerClock(value.now);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      let value = await api.me();
      // Streaks and daily goals follow the learner's local calendar day.
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && tz !== value.timezone) {
        value = await api.updateSettings({ timezone: tz }).catch(() => value);
      }
      setMe(value);
      setMeError(null);
      return value;
    } catch (e) {
      setMeError(e instanceof ApiError ? e.message : "Something went wrong");
      return null;
    }
  }, [setMe]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch of the learner
    void refreshMe();
  }, [refreshMe]);

  const toast = useCallback((message: string, tone: ToastTone = "success", icon?: ReactNode) => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, message, tone, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const value = useMemo(() => ({ me, meError, refreshMe, setMe, toast }), [me, meError, refreshMe, setMe, toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-pop pointer-events-auto flex items-center gap-3 rounded-2xl border-2 border-b-4 px-5 py-3 font-extrabold shadow-lg ${
              t.tone === "error"
                ? "border-red/40 bg-red-light text-red-dark"
                : t.tone === "info"
                  ? "border-blue-border bg-blue-light text-blue"
                  : "border-line bg-surface text-ink-strong"
            }`}
            role="status"
          >
            {t.icon}
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
