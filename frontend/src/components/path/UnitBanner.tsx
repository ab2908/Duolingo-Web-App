"use client";

import { useState } from "react";
import { BookIcon } from "@/components/icons";
import { Modal, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { UNIT_COLORS } from "@/lib/theme";
import type { Guidebook, PathUnit } from "@/lib/types";

/** Renders the tiny markdown subset used by guidebooks (##, -, **bold**). */
function GuideContent({ text }: { text: string }) {
  const bold = (line: string) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") ? (
        <strong key={i} className="text-ink-strong">
          {part.slice(2, -2)}
        </strong>
      ) : (
        part
      ),
    );
  return (
    <div className="flex flex-col gap-2 text-left">
      {text.split("\n").map((line, i) => {
        if (line.startsWith("## ")) return <h3 key={i} className="mt-3 text-lg font-extrabold text-ink-strong">{line.slice(3)}</h3>;
        if (line.startsWith("- "))
          return (
            <div key={i} className="rounded-xl border-2 border-line px-4 py-3 font-semibold">
              {bold(line.slice(2))}
            </div>
          );
        return line.trim() ? <p key={i} className="font-semibold text-ink-muted">{bold(line)}</p> : null;
      })}
    </div>
  );
}

export function UnitBanner({ unit }: { unit: PathUnit }) {
  const color = UNIT_COLORS[unit.color] ?? UNIT_COLORS.green;
  const [guide, setGuide] = useState<Guidebook | null>(null);
  const [open, setOpen] = useState(false);

  const openGuide = async () => {
    setOpen(true);
    if (!guide) setGuide(await api.guidebook(unit.id));
  };

  return (
    <>
      <div
        className="sticky top-[62px] z-20 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-white sm:px-5 lg:top-6"
        style={{ background: color.main, boxShadow: `0 4px 0 ${color.dark}` }}
      >
        <div className="min-w-0">
          <p className="text-[13px] font-extrabold uppercase tracking-wider opacity-80">
            Section {unit.section}, Unit {unit.position}
          </p>
          <h2 className="truncate text-xl font-extrabold">{unit.title}</h2>
        </div>
        {unit.has_guidebook && (
          <button
            onClick={openGuide}
            className="flex shrink-0 items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-sm font-extrabold uppercase tracking-wide transition-colors hover:bg-white/10"
            style={{ borderColor: color.dark, boxShadow: `0 3px 0 ${color.dark}` }}
          >
            <BookIcon size={20} />
            <span className="hidden sm:inline">Guidebook</span>
          </button>
        )}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} className="max-h-[85vh] max-w-lg overflow-y-auto">
        <p className="text-xs font-extrabold uppercase tracking-wider text-ink-soft">Unit {unit.position} guidebook</p>
        <h2 className="mb-2 text-2xl font-extrabold text-ink-strong">{unit.title}</h2>
        {guide ? <GuideContent text={guide.content} /> : <Spinner />}
      </Modal>
    </>
  );
}
