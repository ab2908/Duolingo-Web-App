import { weekdayLetter } from "@/lib/format";
import type { StreakWeekDay } from "@/lib/types";
import { CheckIcon } from "./icons";

/** Monday–Sunday row of circles; orange with a check on days with practice. */
export function WeekStrip({ week, className = "" }: { week: StreakWeekDay[]; className?: string }) {
  return (
    <div className={`flex justify-between rounded-2xl border-2 border-line px-3 py-3 ${className}`}>
      {week.map((d) => (
        <div key={d.date} className="flex flex-col items-center gap-1.5">
          <span className={`text-xs font-extrabold ${d.is_today ? "text-orange" : "text-ink-soft"}`}>{weekdayLetter(d.date)}</span>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full ${
              d.active ? "bg-orange text-white" : "bg-line text-transparent"
            } ${d.is_today && !d.active ? "ring-2 ring-orange ring-offset-2 ring-offset-[var(--surface)]" : ""}`}
          >
            <CheckIcon size={14} />
          </span>
        </div>
      ))}
    </div>
  );
}
