"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  GearIcon,
  HomeNavIcon,
  LeagueNavIcon,
  MoreNavIcon,
  PracticeNavIcon,
  ProfileNavIcon,
  QuestNavIcon,
  ShopNavIcon,
} from "@/components/icons";

export const NAV_ITEMS: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/learn", label: "Learn", icon: <HomeNavIcon size={32} /> },
  { href: "/practice", label: "Practice", icon: <PracticeNavIcon size={32} /> },
  { href: "/leaderboard", label: "Leaderboards", icon: <LeagueNavIcon size={32} /> },
  { href: "/quests", label: "Quests", icon: <QuestNavIcon size={32} /> },
  { href: "/shop", label: "Shop", icon: <ShopNavIcon size={32} /> },
  { href: "/profile", label: "Profile", icon: <ProfileNavIcon size={32} /> },
];

function NavLink({ href, label, icon, active }: { href: string; label: string; icon: ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex h-[52px] items-center gap-5 rounded-xl border-2 px-3 text-[15px] font-extrabold uppercase tracking-wide transition-colors lg:px-4 ${
        active ? "border-blue-border bg-blue-light text-blue" : "border-transparent text-ink-muted hover:bg-surface-2"
      }`}
      title={label}
    >
      <span className="flex w-8 shrink-0 justify-center">{icon}</span>
      <span className="hidden xl:inline">{label}</span>
    </Link>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`select-none text-[32px] font-black lowercase tracking-tight text-green ${className}`}>duolingo</span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <aside className="sticky top-0 z-40 hidden h-screen shrink-0 flex-col border-r-2 border-line px-3 py-6 md:flex md:w-[88px] xl:w-64 xl:px-4">
      <Link href="/learn" className="mb-6 px-3 xl:px-4">
        <Logo className="hidden xl:inline" />
        <span className="text-[32px] font-black text-green xl:hidden">d</span>
      </Link>
      <nav className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
        ))}
        <div className="relative" onPointerLeave={(e) => e.pointerType === "mouse" && setMoreOpen(false)}>
          <button
            className={`flex h-[52px] w-full items-center gap-5 rounded-xl border-2 px-3 text-[15px] font-extrabold uppercase tracking-wide lg:px-4 ${
              pathname.startsWith("/settings") ? "border-blue-border bg-blue-light text-blue" : "border-transparent text-ink-muted hover:bg-surface-2"
            }`}
            onPointerEnter={(e) => e.pointerType === "mouse" && setMoreOpen(true)}
            onClick={() => setMoreOpen((o) => !o)}
          >
            <span className="flex w-8 shrink-0 justify-center">
              <MoreNavIcon size={32} />
            </span>
            <span className="hidden xl:inline">More</span>
          </button>
          {moreOpen && (
            <div className="absolute bottom-0 left-full z-40 pl-2">
              <div className="animate-pop w-56 overflow-hidden rounded-2xl border-2 border-line bg-surface py-2 shadow-xl">
                <Link href="/settings" className="flex items-center gap-3 px-4 py-3 font-extrabold text-ink-muted hover:bg-surface-2">
                  <GearIcon size={20} /> Settings
                </Link>
                <span className="flex items-center justify-between px-4 py-3 font-extrabold text-ink-soft">
                  Help <span className="text-[10px] uppercase">Soon</span>
                </span>
                <span className="flex items-center justify-between px-4 py-3 font-extrabold text-ink-soft">
                  Log out <span className="text-[10px] uppercase">Soon</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const items = [...NAV_ITEMS.filter((i) => i.href !== "/practice"), { href: "/settings", label: "More", icon: <MoreNavIcon size={30} /> }];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t-2 border-line bg-surface px-2 md:hidden">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 ${
              active ? "border-blue-border bg-blue-light" : "border-transparent"
            }`}
          >
            {item.icon}
          </Link>
        );
      })}
    </nav>
  );
}
