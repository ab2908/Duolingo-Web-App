import { BoltIcon, BookIcon, TargetIcon } from "./icons";

export function QuestIcon({ icon, size = 40 }: { icon: string; size?: number }) {
  if (icon === "bolt") return <BoltIcon size={size} />;
  if (icon === "bullseye") return <TargetIcon size={size} />;
  return (
    <span className="flex items-center justify-center rounded-full bg-blue text-white" style={{ width: size, height: size }}>
      <BookIcon size={size * 0.55} />
    </span>
  );
}
