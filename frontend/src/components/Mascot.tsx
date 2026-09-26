/** The app's owl mascot, drawn in SVG with a few moods. */

export type MascotMood = "idle" | "happy" | "cheer" | "sad" | "wink";

export function Mascot({ mood = "idle", size = 120, className = "" }: { mood?: MascotMood; size?: number; className?: string }) {
  const wingsUp = mood === "cheer";
  const sad = mood === "sad";
  const pupilDy = sad ? 3 : mood === "happy" || mood === "cheer" ? -1 : 0;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-hidden>
      {/* shadow */}
      <ellipse cx="60" cy="114" rx="30" ry="4" fill="#000" opacity=".08" />
      {/* wings */}
      <g fill="#46A302">
        {wingsUp ? (
          <>
            <path d="M22 62 C6 50 6 30 14 24 C20 38 26 46 34 52 Z" />
            <path d="M98 62 C114 50 114 30 106 24 C100 38 94 46 86 52 Z" />
          </>
        ) : (
          <>
            <path d="M24 56 C12 64 12 86 20 94 C26 86 30 78 32 70 Z" />
            <path d="M96 56 C108 64 108 86 100 94 C94 86 90 78 88 70 Z" />
          </>
        )}
      </g>
      {/* body */}
      <path d="M60 14 C86 14 98 32 98 58 C98 88 84 106 60 106 C36 106 22 88 22 58 C22 32 34 14 60 14 Z" fill="#58CC02" />
      {/* ear tufts */}
      <path d="M30 26 L34 8 L46 20 Z" fill="#58CC02" />
      <path d="M90 26 L86 8 L74 20 Z" fill="#58CC02" />
      {/* belly */}
      <ellipse cx="60" cy="80" rx="24" ry="22" fill="#89E219" />
      <path d="M50 76 q4 4 8 0 M62 84 q4 4 8 0 M50 90 q4 4 8 0" stroke="#58CC02" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* eyes */}
      <circle cx="44" cy="46" r="15" fill="#fff" />
      <circle cx="76" cy="46" r="15" fill="#fff" />
      {mood === "wink" ? (
        <path d="M68 47 q8 -6 16 0" stroke="#4B4B4B" strokeWidth="4" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="76" cy={47 + pupilDy} r="7.5" fill="#4B4B4B" />
          <circle cx="78.5" cy={44 + pupilDy} r="2.5" fill="#fff" />
        </>
      )}
      <circle cx="44" cy={47 + pupilDy} r="7.5" fill="#4B4B4B" />
      <circle cx="46.5" cy={44 + pupilDy} r="2.5" fill="#fff" />
      {sad && (
        <g stroke="#3C8A00" strokeWidth="4" strokeLinecap="round">
          <path d="M31 33 L49 27" />
          <path d="M89 33 L71 27" />
        </g>
      )}
      {/* beak */}
      <path d="M53 58 L60 54 L67 58 L60 68 Z" fill="#FF9600" />
      <path d="M53 58 L60 54 L67 58 L60 61 Z" fill="#FFC800" />
      {/* feet */}
      <g fill="#FF9600">
        <ellipse cx="48" cy="107" rx="8" ry="4" />
        <ellipse cx="72" cy="107" rx="8" ry="4" />
      </g>
    </svg>
  );
}
