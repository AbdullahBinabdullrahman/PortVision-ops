import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";
import type { Container } from "@portvision/shared/types";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";

const LiveMap = dynamic(() => import("@/components/LiveMap").then((m) => m.LiveMap), {
  ssr: false,
});

export default async function LiveMapPage() {
  const t = await getTranslations();
  const data = await apiFetch<{ items: Container[]; total: number }>(
    "/containers?limit=500",
    { forwardCookies: true }
  );

  const positioned = data.items
    .filter(
      (c): c is Container & { locationLat: number; locationLng: number } =>
        c.locationLat !== null && c.locationLng !== null
    )
    .map((c) => ({
      id: c.id,
      isoCode: c.isoCode,
      status: c.status,
      cargoType: c.cargoType,
      locationLat: c.locationLat,
      locationLng: c.locationLng,
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        label={t("liveMap.tag")}
        title={t("liveMap.title")}
        subtitle={t("liveMap.subtitle")}
        right={<Badge tone="muted">{t("liveMap.mapBadge")}</Badge>}
      />
      <p className="font-mono text-[11px] text-text-dim">
        {t("liveMap.totalPositioned", { count: positioned.length })}
      </p>
      <LiveMap containers={positioned} />
    </div>
  );
}
