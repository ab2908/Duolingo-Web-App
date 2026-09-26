"use client";

import { useState } from "react";

const COLORS = ["#58cc02", "#1cb0f6", "#ff4b4b", "#ffc800", "#ce82ff", "#ff9600"];

/** Lightweight CSS confetti burst for celebration screens. */
export function Confetti({ pieces = 70 }: { pieces?: number }) {
  // Random layout is computed once per mount (lazy initializer keeps render pure).
  const [bits] = useState(() =>
    Array.from({ length: pieces }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2.2 + Math.random() * 1.6,
      drift: `${(Math.random() - 0.5) * 160}px`,
      spin: `${(Math.random() - 0.5) * 1080}deg`,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 8,
      round: Math.random() > 0.6,
    })),
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={
            {
              left: `${b.left}%`,
              width: b.size,
              height: b.round ? b.size : b.size * 0.45,
              background: b.color,
              borderRadius: b.round ? "50%" : 2,
              animation: `confetti-fall ${b.duration}s ${b.delay}s ease-in both`,
              "--drift": b.drift,
              "--spin": b.spin,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
