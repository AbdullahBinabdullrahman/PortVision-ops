import { getTranslations } from "next-intl/server";
import type { OpsHealth, Action, Alert, SensorReading } from "@portvision/shared/types";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { ConnectivityWidget } from "@/components/ConnectivityWidget";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { SensorHealthGrid } from "@/components/SensorHealthGrid";
import { Badge } from "@/components/ui/Badge";

interface InventoryRes {
  items: {
    containerId: string;
    isoCode: string;
    bleBeaconId: string | null;
    lastReading: { sensorType: string; value: unknown; recordedAt: string } | null;
  }[];
}

export default async function OverviewPage() {
  const t = await getTranslations();
  const [health, actions, alerts, inventory, recent] = await Promise.all([
    apiFetch<OpsHealth>("/ops/health", { forwardCookies: true }),
    apiFetch<{ items: (Action & { operator?: { name: string }; container?: { isoCode: string } })[] }>(
      "/actions?limit=15",
      { forwardCookies: true }
    ),
    apiFetch<{ items: (Alert & { container?: { isoCode: string } })[] }>(
      "/alerts?acknowledged=false&limit=15",
      { forwardCookies: true }
    ),
    apiFetch<InventoryRes>("/iot/inventory", { forwardCookies: true }),
    apiFetch<{ items: SensorReading[] }>("/sensors/recent?limit=50", {
      forwardCookies: true,
    }),
  ]);

  const totalHeadsets =
    health.fiveG.headsetsOn5g + health.fiveG.headsetsOnWifi + health.fiveG.headsetsOffline;
  const onlineHeadsets = health.fiveG.headsetsOn5g + health.fiveG.headsetsOnWifi;

  return (
    <div className="space-y-8">
      <PageHeader
        label={t("overview.tag")}
        title={t("overview.title")}
        subtitle={t("overview.subtitle")}
        right={
          <Badge tone={health.simMode ? "warning" : "success"}>
            {health.simMode ? t("common.simMode") : t("common.liveStatus")}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t("overview.headsetsOnline")}
          value={`${onlineHeadsets}/${totalHeadsets}`}
          hint={t("overview.wsConnections", { count: health.ws.headsetClients })}
        />
        <StatTile
          label={t("overview.openAlerts")}
          value={alerts.items.length}
          hint={alerts.items.length === 0 ? t("overview.allClear") : t("overview.unacknowledged")}
        />
        <StatTile
          label={t("overview.fiveGHeadsets")}
          value={health.fiveG.headsetsOn5g}
          hint={
            health.fiveG.avgRssiDbm !== null
              ? t("overview.avgRssi", { value: Math.round(health.fiveG.avgRssiDbm) })
              : t("overview.noSignal")
          }
        />
        <StatTile
          label={t("overview.sensorThroughput")}
          value={health.iot.onlineSensors}
          hint={t("overview.bleTracked", { count: health.iot.bleBeacons })}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ConnectivityWidget initial={health} />
        </div>
        <div className="lg:col-span-2">
          <LiveActivityFeed initialActions={actions.items} initialAlerts={alerts.items} />
        </div>
      </div>

      <SensorHealthGrid inventory={inventory.items} recent={recent.items} />
    </div>
  );
}
