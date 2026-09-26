"use client";

import { useAppState } from "@/components/AppState";
import { GemIcon, HeartIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { ComingSoonBadge, ErrorState, SectionTitle, Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { ShopItem } from "@/lib/types";

function ItemIcon({ code }: { code: ShopItem["code"] }) {
  if (code === "heart_refill") return <HeartIcon size={56} />;
  return <span className="emoji text-5xl">🧊</span>;
}

export default function ShopPage() {
  const { setMe, toast } = useAppState();
  const { data: shop, error, reload } = useApi(api.shop);

  const buy = async (item: ShopItem) => {
    try {
      setMe(await api.purchase(item.code));
      toast(item.code === "heart_refill" ? "Hearts refilled!" : "Streak Freeze equipped!", "success", <GemIcon size={20} />);
      await reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Purchase failed", "error");
    }
  };

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!shop) return <Spinner label="Opening the shop" />;

  const hearts = shop.items.filter((i) => i.code === "heart_refill");
  const powerUps = shop.items.filter((i) => i.code !== "heart_refill");

  const row = (item: ShopItem) => (
    <div key={item.code} className="flex items-center gap-5 border-t-2 border-line py-6">
      <div className="flex w-20 shrink-0 justify-center">
        <ItemIcon code={item.code} />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-extrabold text-ink-strong">{item.title}</h3>
        <p className="font-semibold text-ink-muted">{item.description}</p>
        {item.owned !== null && <p className="mt-1 text-sm font-extrabold text-blue">{item.owned} equipped</p>}
      </div>
      <button className="btn btn-outline min-w-[120px] !text-red" onClick={() => buy(item)} disabled={!item.available || shop.gems < item.price}>
        {item.available ? (
          <>
            <GemIcon size={18} /> {item.price}
          </>
        ) : (
          (item.reason ?? "Unavailable")
        )}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink-strong">Shop</h1>
        <span className="flex items-center gap-2 text-lg font-extrabold text-red">
          <GemIcon size={26} /> {shop.gems}
        </span>
      </div>

      <section>
        <SectionTitle>Hearts</SectionTitle>
        {hearts.map(row)}
        <div className="flex items-center gap-5 border-t-2 border-line py-6">
          <div className="flex w-20 shrink-0 justify-center">
            <Mascot mood="wink" size={70} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-extrabold text-ink-strong">Unlimited Hearts</h3>
            <p className="font-semibold text-ink-muted">Never run out of hearts with Super!</p>
          </div>
          <ComingSoonBadge />
        </div>
      </section>

      <section>
        <SectionTitle>Power-ups</SectionTitle>
        {powerUps.map(row)}
      </section>

      <p className="text-center text-sm font-bold text-ink-soft">Gems are earned from treasure chests on the path. Real purchases are mocked.</p>
    </div>
  );
}
