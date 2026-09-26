import { MobileNav, Sidebar } from "@/components/layout/Sidebar";
import { RightRail } from "@/components/layout/RightRail";
import { StatsBar } from "@/components/layout/StatsBar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center">
      <Sidebar />
      <div className="flex w-full max-w-[1056px] justify-center gap-4 lg:gap-12 lg:px-6">
        <main className="w-full max-w-[600px] min-w-0 pb-24 md:pb-10">
          {/* Mobile / tablet stats header (the right rail shows them on desktop). */}
          <div className="sticky top-0 z-30 border-b-2 border-line bg-surface px-3 py-2 lg:hidden">
            <StatsBar compact />
          </div>
          <div className="px-4 pt-6 sm:px-6">{children}</div>
        </main>
        <RightRail />
      </div>
      <MobileNav />
    </div>
  );
}
