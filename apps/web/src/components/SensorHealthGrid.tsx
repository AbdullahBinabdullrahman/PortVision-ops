"use client";

import { useTranslations } from "next-intl";
import type { SensorReading } from "@portvision/shared/types";
import { Card, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";

interface InventoryItem {
  containerId: string;
  isoCode: string;
  bleBeaconId: string | null;
  lastReading: { sensorType: string; value: unknown; recordedAt: string } | null;
}

export function SensorHealthGrid({
  inventory,
  recent,
}: {
  inventory: InventoryItem[];
  recent: SensorReading[];
}) {
  const t = useTranslations();
  const stale = (iso: string) => Date.now() - new Date(iso).getTime() > 5 * 60_000;
  const onlineCount = inventory.filter(
    (i) => i.lastReading && !stale(i.lastReading.recordedAt)
  ).length;
  const totalBeacons = inventory.filter((i) => i.bleBeaconId).length;

  return (
    <Card>
      <CardHeader
        title={t("sensors.title")}
        subtitle={t("sensors.subtitle")}
        right={
          <span className="font-mono text-xs text-text-muted">
            {t("sensors.summary", {
              online: onlineCount,
              total: inventory.length,
              beacons: totalBeacons,
            })}
          </span>
        }
      />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {inventory.slice(0, 12).map((it) => {
          const isStale = !it.lastReading || stale(it.lastReading.recordedAt);
          return (
            <div
              key={it.containerId}
              className="rounded-lg border border-border bg-card-inner p-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-text">{it.isoCode}</span>
                <Badge tone={isStale ? "muted" : "success"}>
                  {isStale ? t("common.stale") : t("common.live")}
                </Badge>
              </div>
              <p className="mt-1 font-mono text-[10px] text-text-dim">
                {t("sensors.ble")}: {it.bleBeaconId ?? t("common.dash")}
              </p>
              {it.lastReading && (
                <p className="mt-1 text-xs text-text-muted">
                  {t("sensors.lastReading", {
                    type: it.lastReading.sensorType,
                    time: new Date(it.lastReading.recordedAt).toLocaleTimeString(),
                  })}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 font-mono text-[11px] text-text-dim">
        {t("sensors.ingestedRecent", { count: recent.length })}
      </p>
    </Card>
  );
}
