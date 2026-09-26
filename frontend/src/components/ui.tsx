"use client";

import { useEffect, type ReactNode } from "react";
import { AVATAR_COLORS } from "@/lib/theme";
import { CloseIcon } from "./icons";

export function ProgressBar({
  value,
  max,
  color = "var(--green)",
  height = 16,
  className = "",
}: {
  value: number;
  max: number;
  color?: string;
  height?: number;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className={`relative w-full overflow-hidden rounded-full bg-line ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
    >
      <div
        className="relative h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%`, background: color, minWidth: pct > 0 ? height : 0 }}
      >
        {/* glossy highlight stripe */}
        <div
          className="absolute left-2 right-2 rounded-full bg-white/30"
          style={{ top: height * 0.22, height: Math.max(3, height * 0.22) }}
        />
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  children,
  className = "",
}: {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ background: "var(--overlay)" }}
      onClick={onClose}
      role="dialog"
      aria-modal
    >
      <div
        className={`animate-pop relative w-full max-w-md rounded-t-3xl bg-surface p-6 sm:rounded-3xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button onClick={onClose} className="absolute right-4 top-4 text-ink-soft hover:text-ink" aria-label="Close">
            <CloseIcon size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function Avatar({ name, color, size = 48 }: { name: string; color: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-extrabold text-white"
      style={{ width: size, height: size, background: AVATAR_COLORS[color] ?? AVATAR_COLORS.blue, fontSize: size * 0.42 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-soft" role="status">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-green" />
      <span className="text-sm font-bold uppercase tracking-wide">{label}…</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="max-w-sm font-bold text-ink-muted">{message}</p>
      {onRetry && (
        <button className="btn btn-blue btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xl font-extrabold text-ink-strong">{children}</h2>
      {action}
    </div>
  );
}

export function ComingSoonBadge() {
  return (
    <span className="rounded-lg bg-surface-2 px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
      Coming soon
    </span>
  );
}
