/* Hand-drawn SVG icon set in a chunky, rounded Duolingo-like style. */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, viewBox = "0 0 24 24", ...rest }: IconProps & { viewBox?: string }) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none" aria-hidden {...rest}>
      {children}
    </svg>
  );
}

export function FlameIcon({ active = true, light = false, ...p }: IconProps & { active?: boolean; light?: boolean }) {
  // ``light`` draws a white flame for use on orange badges.
  const outer = light ? "#fff" : active ? "#FF9600" : "var(--locked-icon)";
  const inner = active ? "#FFC800" : "var(--locked)";
  return (
    <Svg viewBox="0 0 24 28" {...p}>
      <path
        d="M12 1.5c.6 3.2 2.6 5 4.7 7 2.3 2.3 4.3 5 4.3 9.1C21 22.7 17 26.5 12 26.5S3 22.7 3 17.6c0-3.1 1.4-5.4 3-7.2.5 1.8 1.6 3.1 3 3.6C8.4 9.4 9.4 4.8 12 1.5Z"
        fill={outer}
      />
      <path
        d="M12 13.5c1.2 1.6 4.2 3.4 4.2 6.8 0 2.6-1.9 4.6-4.2 4.6s-4.2-2-4.2-4.6c0-2 1-3.2 2-4.1.2 1 .8 1.7 1.5 2 .1-1.9.2-3.1.7-4.7Z"
        fill={inner}
      />
    </Svg>
  );
}

export function GemIcon(p: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" {...p}>
      <path d="M6 3h12l5 6.5L12 22 1 9.5 6 3Z" fill="#FF4B4B" />
      <path d="M6 3h12l5 6.5H1L6 3Z" fill="#FF7B7B" />
      <path d="M8.5 9.5 12 3l3.5 6.5L12 22 8.5 9.5Z" fill="#FF6363" />
      <path d="M8.5 9.5 12 3l3.5 6.5h-7Z" fill="#FFB0B0" />
    </Svg>
  );
}

export function HeartIcon({ empty = false, ...p }: IconProps & { empty?: boolean }) {
  return (
    <Svg viewBox="0 0 24 22" {...p}>
      <path
        d="M12 21.2S1.5 14.7 1.5 7.4C1.5 4 4.1 1.5 7.3 1.5c2 0 3.7 1 4.7 2.6 1-1.6 2.7-2.6 4.7-2.6 3.2 0 5.8 2.5 5.8 5.9 0 7.3-10.5 13.8-10.5 13.8Z"
        fill={empty ? "var(--locked)" : "#FF4B4B"}
      />
      {!empty && <path d="M5.2 6.1c.4-1.4 1.6-2.3 2.9-2.3" stroke="#FFB7B7" strokeWidth="2.2" strokeLinecap="round" />}
    </Svg>
  );
}

export function BoltIcon(p: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" {...p}>
      <path d="M14.5 1.5 4 13.5h7l-1.5 9L20 10.5h-7l1.5-9Z" fill="#FFC800" stroke="#FF9600" strokeWidth="1.2" strokeLinejoin="round" />
    </Svg>
  );
}

export function StarIcon(p: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" {...p}>
      <path
        d="M12 2.2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 3.1 1.1-6.5L2.6 9l6.5-.9L12 2.2Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4.5 12.5l5 5 10-11" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CloseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

export function LockIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="10" width="16" height="12" rx="3" fill="currentColor" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2.8" />
    </Svg>
  );
}

export function DumbbellIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="1.5" y="8" width="4" height="8" rx="1.5" fill="currentColor" />
      <rect x="18.5" y="8" width="4" height="8" rx="1.5" fill="currentColor" />
      <rect x="4.5" y="5.5" width="4" height="13" rx="1.8" fill="currentColor" />
      <rect x="15.5" y="5.5" width="4" height="13" rx="1.8" fill="currentColor" />
      <rect x="8" y="10.5" width="8" height="3" rx="1" fill="currentColor" />
    </Svg>
  );
}

export function TrophyIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 3h10v6a5 5 0 0 1-10 0V3Z" fill="currentColor" />
      <path d="M7 5H3.5v1.5A3.5 3.5 0 0 0 7 10M17 5h3.5v1.5A3.5 3.5 0 0 1 17 10" stroke="currentColor" strokeWidth="2" />
      <rect x="10.5" y="13" width="3" height="4" fill="currentColor" />
      <rect x="7" y="17" width="10" height="4" rx="1.2" fill="currentColor" />
    </Svg>
  );
}

export function CrownIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8Z" fill="#FFC800" stroke="#E5B400" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="12" cy="14.5" r="1.8" fill="#FF9600" />
    </Svg>
  );
}

export function ChestIcon({ open = false, locked = false, ...p }: IconProps & { open?: boolean; locked?: boolean }) {
  const wood = locked ? "var(--locked)" : "#C47B38";
  const woodDark = locked ? "var(--locked-dark)" : "#9A5B25";
  const metal = locked ? "var(--locked-icon)" : "#FFC800";
  return (
    <Svg viewBox="0 0 48 40" {...p}>
      {open ? (
        <>
          <path d="M6 12 10 2h28l4 10H6Z" fill={woodDark} />
          <rect x="4" y="16" width="40" height="22" rx="4" fill={wood} />
          <rect x="6" y="12" width="36" height="7" rx="2" fill={locked ? "var(--locked-dark)" : "#FFE27A"} />
          <rect x="4" y="22" width="40" height="3.5" fill={woodDark} />
        </>
      ) : (
        <>
          <path d="M4 16c0-7 5-12 12-12h16c7 0 12 5 12 12v2H4v-2Z" fill={wood} />
          <rect x="4" y="18" width="40" height="20" rx="4" fill={woodDark} />
          <rect x="4" y="18" width="40" height="6" fill={wood} />
          <rect x="19" y="14" width="10" height="12" rx="2.5" fill={metal} />
          <circle cx="24" cy="20" r="2" fill={woodDark} />
        </>
      )}
    </Svg>
  );
}

export function BookIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5v-16Z" fill="currentColor" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v4H6.5A2.5 2.5 0 0 1 4 20.5Z" fill="currentColor" opacity=".6" />
    </Svg>
  );
}

export function SpeakerIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 9.5h4l5-4.5v14l-5-4.5H3v-5Z" fill="currentColor" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export function TurtleIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <ellipse cx="11" cy="13" rx="7" ry="5" fill="currentColor" />
      <circle cx="19.5" cy="12" r="2.5" fill="currentColor" />
      <rect x="5" y="16" width="3" height="4" rx="1.3" fill="currentColor" />
      <rect x="13" y="16" width="3" height="4" rx="1.3" fill="currentColor" />
    </Svg>
  );
}

export function TargetIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="10" fill="#FF4B4B" />
      <circle cx="12" cy="12" r="6.5" fill="#fff" />
      <circle cx="12" cy="12" r="3.2" fill="#FF4B4B" />
    </Svg>
  );
}

export function ClockIcon({ handColor = "#fff", ...p }: IconProps & { handColor?: string }) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M12 7v5.5l3.5 2" stroke={handColor} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

export function GearIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path
        d="M10.3 2h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9-2.6-.5v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8.5-2.6Z"
        fill="currentColor"
      />
      <circle cx="12" cy="12" r="3.5" fill="var(--surface)" />
    </Svg>
  );
}

export function ShieldIcon({ color = "#CD7900", ...p }: IconProps & { color?: string }) {
  return (
    <Svg {...p}>
      <path d="M12 1.5 21 5v6.5c0 5.5-3.8 9.6-9 11-5.2-1.4-9-5.5-9-11V5l9-3.5Z" fill={color} />
      <path d="M12 4.2 18.5 6.8v4.7c0 4-2.7 7.1-6.5 8.3-3.8-1.2-6.5-4.3-6.5-8.3V6.8L12 4.2Z" fill="#fff" opacity=".28" />
    </Svg>
  );
}

// --- Navigation icons -------------------------------------------------------

export function HomeNavIcon(p: IconProps) {
  return (
    <Svg viewBox="0 0 32 32" {...p}>
      <path d="M4 14.5 16 4l12 10.5V27a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V14.5Z" fill="#FFC800" />
      <path d="M2.5 15.5 16 3.5l13.5 12" stroke="#FF4B4B" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="12.5" y="18" width="7" height="11" rx="1.5" fill="#FF9600" />
    </Svg>
  );
}

export function LeagueNavIcon(p: IconProps) {
  return <ShieldIcon viewBox="0 0 24 24" color="#FFC800" {...p} />;
}

export function QuestNavIcon(p: IconProps) {
  return <ChestIcon {...p} />;
}

export function ShopNavIcon(p: IconProps) {
  return (
    <Svg viewBox="0 0 32 32" {...p}>
      <rect x="5" y="13" width="22" height="16" rx="2" fill="#FFB020" />
      <path d="M3 6h26l-2 8H5L3 6Z" fill="#FF4B4B" />
      <path d="M9.5 6 9 14M16 6v8M22.5 6l.5 8" stroke="#fff" strokeWidth="2.2" />
      <rect x="13" y="19" width="6" height="10" rx="1" fill="#C47B38" />
    </Svg>
  );
}

export function ProfileNavIcon(p: IconProps) {
  return (
    <Svg viewBox="0 0 32 32" {...p}>
      <circle cx="16" cy="16" r="14" fill="#CE82FF" />
      <circle cx="16" cy="13" r="5" fill="#fff" />
      <path d="M7.5 25.5c1.8-4 5-6 8.5-6s6.7 2 8.5 6" fill="#fff" />
    </Svg>
  );
}

export function MoreNavIcon(p: IconProps) {
  return (
    <Svg viewBox="0 0 32 32" {...p}>
      <circle cx="16" cy="16" r="14" fill="#1CB0F6" />
      <circle cx="10" cy="16" r="2.4" fill="#fff" />
      <circle cx="16" cy="16" r="2.4" fill="#fff" />
      <circle cx="22" cy="16" r="2.4" fill="#fff" />
    </Svg>
  );
}

export function PracticeNavIcon(p: IconProps) {
  return (
    <Svg viewBox="0 0 32 32" {...p}>
      <circle cx="16" cy="16" r="14" fill="#2BDCC8" />
      <g transform="translate(4 4)" color="#fff">
        <DumbbellIcon size={24} />
      </g>
    </Svg>
  );
}

export function FlagES({ size = 32, ...p }: IconProps) {
  return (
    <svg width={size} height={(size * 3) / 4} viewBox="0 0 32 24" aria-hidden {...p}>
      <rect width="32" height="24" rx="4" fill="#C60B1E" />
      <rect y="6" width="32" height="12" fill="#FFC400" />
      <rect x="7" y="9" width="4" height="6" rx="1" fill="#C60B1E" opacity=".75" />
    </svg>
  );
}

/** Icon used inside a path node, chosen from the skill's ``icon`` field. */
export function NodeGlyph({ kind, state, legendary, size = 34 }: { kind: string; state: string; legendary?: boolean; size?: number }) {
  if (kind === "review") return <TrophyIcon size={size} />;
  if (state === "completed" && legendary) return <CrownIcon size={size} />;
  if (state === "completed") return <CheckIcon size={size} />;
  if (state === "locked") return <LockIcon size={size - 6} />;
  return <StarIcon size={size} />;
}

export function AchievementGlyph({ icon, size = 40 }: { icon: string; size?: number }) {
  switch (icon) {
    case "flame":
      return <FlameIcon size={size} light />;
    case "bolt":
      return <BoltIcon size={size} />;
    case "book":
      return <BookIcon size={size} color="#fff" />;
    case "target":
      return <TargetIcon size={size} />;
    case "crown":
    case "legendary":
      return <CrownIcon size={size} />;
    case "trophy":
      return <TrophyIcon size={size} color="#fff" />;
    case "goal":
      return <ClockIcon size={size} color="#fff" handColor="#1fb3a3" />;
    default:
      return <StarIcon size={size} color="#fff" />;
  }
}
