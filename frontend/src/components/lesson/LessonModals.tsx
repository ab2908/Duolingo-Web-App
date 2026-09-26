"use client";

import { GemIcon, HeartIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { Modal } from "@/components/ui";

export function QuitModal({ open, onStay, onQuit }: { open: boolean; onStay: () => void; onQuit: () => void }) {
  return (
    <Modal open={open} onClose={onStay}>
      <div className="flex flex-col items-center gap-4 text-center">
        <Mascot mood="sad" size={120} />
        <h2 className="text-2xl font-extrabold text-ink-strong">Wait, don&apos;t go! You&apos;ll lose your progress if you quit now</h2>
        <button className="btn btn-blue w-full" onClick={onStay} autoFocus>
          Keep learning
        </button>
        <button className="btn btn-ghost w-full text-red" style={{ ["--btn-text" as string]: "var(--red)" }} onClick={onQuit}>
          End session
        </button>
      </div>
    </Modal>
  );
}

export function OutOfHeartsModal({
  open,
  gems,
  refillCost,
  onRefill,
  onPractice,
  onQuit,
}: {
  open: boolean;
  gems: number;
  refillCost: number;
  onRefill: () => void;
  onPractice: () => void;
  onQuit: () => void;
}) {
  return (
    <Modal open={open}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <Mascot mood="sad" size={120} />
          <span className="absolute -right-2 bottom-2">
            <HeartIcon size={40} empty />
          </span>
        </div>
        <h2 className="text-2xl font-extrabold text-ink-strong">You ran out of hearts!</h2>
        <p className="font-semibold text-ink-muted">Refill your hearts to keep going, or practice to earn one back for free.</p>
        <button className="btn btn-outline-blue w-full justify-between" onClick={onRefill} disabled={gems < refillCost}>
          <span className="flex items-center gap-2">
            <HeartIcon size={20} /> Refill
          </span>
          <span className="flex items-center gap-1 text-red">
            <GemIcon size={18} /> {refillCost}
          </span>
        </button>
        <button className="btn btn-blue w-full" onClick={onPractice}>
          Practice to earn hearts
        </button>
        <button className="btn btn-ghost w-full" onClick={onQuit}>
          No thanks
        </button>
      </div>
    </Modal>
  );
}

export function LegendaryFailedModal({ open, reason, onQuit }: { open: boolean; reason: string; onQuit: () => void }) {
  return (
    <Modal open={open}>
      <div className="flex flex-col items-center gap-4 text-center">
        <Mascot mood="sad" size={120} />
        <h2 className="text-2xl font-extrabold text-ink-strong">Legendary challenge failed</h2>
        <p className="font-semibold text-ink-muted">{reason} Practice a little more and try again!</p>
        <button className="btn btn-blue w-full" onClick={onQuit} autoFocus>
          Back to path
        </button>
      </div>
    </Modal>
  );
}
