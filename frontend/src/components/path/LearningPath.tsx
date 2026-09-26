"use client";

import { useEffect, useRef, useState } from "react";
import { useAppState } from "@/components/AppState";
import { ChestIcon, GemIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { Modal } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { sounds } from "@/lib/sound";
import type { LearningPath as Path, PathSkill } from "@/lib/types";
import { NodePopover } from "./NodePopover";
import { PathNode } from "./PathNode";
import { UnitBanner } from "./UnitBanner";

// Horizontal offsets (px) that give the path its winding shape.
const WAVE = [0, 44, 70, 44, 0, -44, -70, -44];

export function LearningPath({ path, onChange }: { path: Path; onChange: () => void }) {
  const { refreshMe, toast } = useAppState();
  const [selected, setSelected] = useState<number | null>(null);
  const [chestReward, setChestReward] = useState<number | null>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (selected === null) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-node]")) setSelected(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [selected]);

  const openChest = async (skill: PathSkill) => {
    try {
      const res = await api.openChest(skill.id);
      sounds.chest();
      setChestReward(res.gems_awarded);
      await refreshMe();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't open the chest", "error");
    }
  };

  const handleClick = (skill: PathSkill) => {
    if (skill.kind === "chest" && skill.state === "active") {
      void openChest(skill);
      return;
    }
    setSelected((cur) => (cur === skill.id ? null : skill.id));
  };

  return (
    <div className="flex flex-col gap-10">
      {path.units.map((unit, unitIndex) => {
        const direction = unitIndex % 2 === 0 ? 1 : -1;
        return (
          <section key={unit.id} className="relative">
            <UnitBanner unit={unit} />
            <div className="relative mx-auto mt-14 flex flex-col items-center gap-5 pb-4">
              {unit.skills.map((skill, i) => {
                const offset = WAVE[i % WAVE.length] * direction;
                return (
                  <div key={skill.id} data-node className="relative" style={{ transform: `translateX(${offset}px)`, zIndex: selected === skill.id ? 25 : 1 }}>
                    <PathNode
                      ref={skill.state === "active" ? activeRef : undefined}
                      skill={skill}
                      unitColor={unit.color}
                      selected={selected === skill.id}
                      onClick={() => handleClick(skill)}
                    />
                    {selected === skill.id && <NodePopover skill={skill} unitColor={unit.color} />}
                  </div>
                );
              })}
              {/* Mascot hanging out beside the path, alternating sides per unit. */}
              <div
                className="pointer-events-none absolute top-[150px] hidden sm:block"
                style={direction === 1 ? { left: "8%" } : { right: "8%" }}
              >
                <Mascot mood={unit.completed ? "cheer" : unitIndex === 0 ? "happy" : "idle"} size={130} />
              </div>
            </div>
            {unitIndex < path.units.length - 1 && (
              <div className="mt-8 flex items-center gap-4 text-ink-soft">
                <div className="h-0.5 flex-1 bg-line" />
                <span className="text-center text-base font-extrabold">{path.units[unitIndex + 1].title}</span>
                <div className="h-0.5 flex-1 bg-line" />
              </div>
            )}
          </section>
        );
      })}

      <Modal
        open={chestReward !== null}
        onClose={() => {
          setChestReward(null);
          onChange();
        }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="animate-pop">
            <ChestIcon size={120} open />
          </div>
          <h2 className="text-2xl font-extrabold text-ink-strong">You found a treasure chest!</h2>
          <p className="flex items-center gap-2 text-xl font-extrabold text-red">
            <GemIcon size={28} /> +{chestReward} gems
          </p>
          <button
            className="btn mt-2 w-full"
            onClick={() => {
              setChestReward(null);
              onChange();
            }}
          >
            Continue
          </button>
        </div>
      </Modal>
    </div>
  );
}

export function PathEnd() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <Mascot mood="cheer" size={110} />
      <p className="max-w-xs font-extrabold text-ink-soft">More units are on the way. Keep practicing to reach Legendary!</p>
    </div>
  );
}
