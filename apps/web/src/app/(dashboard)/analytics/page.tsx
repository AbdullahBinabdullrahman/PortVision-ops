import { getTranslations } from "next-intl/server";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import type { Action, Alert, SensorReading } from "@portvision/shared/types";

export default async function AnalyticsPage() {
  const t = await getTranslations();
  const [actions, alerts, readings] = await Promise.all([
    apiFetch<{ items: Action[] }>("/actions?limit=200", { forwardCookies: true }),
    apiFetch<{ items: Alert[] }>("/alerts?limit=200", { forwardCookies: true }),
    apiFetch<{ items: SensorReading[] }>("/sensors/recent?limit=500", {
      forwardCookies: true,
    }),
  ]);

  const now = Date.now();
  const hourly = Array.from({ length: 24 }, () => 0);
  for (const a of actions.items) {
    const hoursAgo = Math.floor((now - new Date(a.createdAt).getTime()) / 3600_000);
    if (hoursAgo >= 0 && hoursAgo < 24) hourly[23 - hoursAgo]! += 1;
  }
  const maxHourly = Math.max(1, ...hourly);

  const ackedAlerts = alerts.items.filter((a) => a.acknowledged);
  const openAlerts = alerts.items.filter((a) => !a.acknowledged);

  const sensorByType = readings.items.reduce<Record<string, number>>((acc, r) => {
    acc[r.sensorType] = (acc[r.sensorType] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        label={t("analytics.tag")}
        title={t("analytics.title")}
        subtitle={t("analytics.subtitle")}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("analytics.actionsPerHour")} subtitle={t("analytics.last24h")} />
          <div className="flex h-40 items-end gap-1">
            {hourly.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-accent/40 hover:bg-accent"
                style={{ height: `${(v / maxHourly) * 100}%` }}
              />
            ))}
          </div>
          <p className="mt-2 font-mono text-[11px] text-text-dim">
            {t("analytics.totalActions", { count: actions.items.length })}
          </p>
        </Card>

        <Card>
          <CardHeader
            title={t("analytics.alertsCardTitle")}
            subtitle={t("analytics.alertsCardSubtitle")}
          />
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg border border-border bg-card-inner p-4">
              <p className="font-mono text-3xl text-warning">{openAlerts.length}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-text-muted">
                {t("analytics.alertsOpen")}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card-inner p-4">
              <p className="font-mono text-3xl text-success">{ackedAlerts.length}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-text-muted">
                {t("analytics.alertsAck")}
              </p>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title={t("analytics.sensorReadingMix")}
            subtitle={t("analytics.samples", { count: readings.items.length })}
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(["temp", "humidity", "tilt", "shock"] as const).map((type) => (
              <div key={type} className="rounded-lg border border-border bg-card-inner p-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
                  {type}
                </p>
                <p className="mt-1 font-mono text-2xl">{sensorByType[type] ?? 0}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
