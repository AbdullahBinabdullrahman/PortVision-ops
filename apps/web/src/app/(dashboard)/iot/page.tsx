import { getTranslations } from "next-intl/server";
import type { OpsHealth, SensorReading } from "@portvision/shared/types";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ConnectivityWidget } from "@/components/ConnectivityWidget";

interface InventoryRes {
  items: {
    containerId: string;
    isoCode: string;
    bleBeaconId: string | null;
    lastReading: { sensorType: string; value: unknown; recordedAt: string } | null;
  }[];
}

export default async function IotPage() {
  const t = await getTranslations();
  const [health, inventory, recent] = await Promise.all([
    apiFetch<OpsHealth>("/ops/health", { forwardCookies: true }),
    apiFetch<InventoryRes>("/iot/inventory", { forwardCookies: true }),
    apiFetch<{ items: SensorReading[] }>("/sensors/recent?limit=100", { forwardCookies: true }),
  ]);

  const byType = recent.items.reduce<Record<string, number>>((acc, r) => {
    acc[r.sensorType] = (acc[r.sensorType] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        label={t("iot.tag")}
        title={t("iot.title")}
        subtitle={t("iot.subtitle")}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ConnectivityWidget initial={health} />
        <Card>
          <CardHeader
            title={t("iot.sensorMix")}
            subtitle={t("iot.readingsCount", { count: recent.items.length })}
          />
          <div className="grid grid-cols-2 gap-3">
            {(["temp", "humidity", "tilt", "shock"] as const).map((type) => (
              <div
                key={type}
                className="rounded-lg border border-border bg-card-inner p-3"
              >
                <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
                  {type}
                </p>
                <p className="mt-1 font-mono text-2xl text-text">{byType[type] ?? 0}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={t("iot.bleInventoryTitle")}
          subtitle={t("iot.bleInventorySubtitle")}
        />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {inventory.items.map((it) => {
            const isStale =
              !it.lastReading ||
              Date.now() - new Date(it.lastReading.recordedAt).getTime() > 5 * 60_000;
            return (
              <div
                key={it.containerId}
                className="flex items-center justify-between rounded-lg border border-border bg-card-inner p-3"
              >
                <div>
                  <p className="font-mono text-sm">{it.isoCode}</p>
                  <p className="font-mono text-[10px] text-text-dim">
                    {it.bleBeaconId ?? t("common.dash")}
                  </p>
                </div>
                <Badge tone={isStale ? "muted" : "success"}>
                  {isStale ? t("common.stale") : t("common.live")}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
