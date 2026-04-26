"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { OpsHealth } from "@portvision/shared/types";
import { Card, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";

type RowStatus = "ok" | "stub" | "idle" | "down";

export function ConnectivityWidget({ initial }: { initial: OpsHealth }) {
  const t = useTranslations();
  const [health, setHealth] = useState<OpsHealth>(initial);

  useEffect(() => {
    const tick = async () => {
      try {
        const res = await fetch(`/api/v1/ops/health`, { cache: "no-store" });
        if (res.ok) setHealth((await res.json()) as OpsHealth);
      } catch {
        // ignore — surface as stale
      }
    };
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card>
      <CardHeader title={t("connectivity.title")} subtitle={t("connectivity.subtitle")} />
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Row
          label={t("connectivity.api")}
          status={health.api.ok ? "ok" : "down"}
          detail={t("connectivity.uptimeSeconds", { seconds: health.api.uptimeSeconds })}
        />
        <Row
          label={t("connectivity.postgres")}
          status={health.db.ok ? "ok" : "down"}
          detail={health.db.latencyMs !== null ? `${health.db.latencyMs}ms` : t("common.dash")}
        />
        <Row
          label={t("connectivity.mqtt")}
          status={health.mqtt.connected ? "ok" : "down"}
          detail={health.mqtt.broker}
        />
        <Row
          label={t("connectivity.zigbee2mqtt")}
          status={health.zigbee2mqtt.ok ? "stub" : "down"}
          detail={health.zigbee2mqtt.mode}
        />
        <Row
          label={t("connectivity.wsHeadsets")}
          status={health.ws.headsetClients > 0 ? "ok" : "idle"}
          detail={t("connectivity.connectedCount", { count: health.ws.headsetClients })}
        />
        <Row
          label={t("connectivity.wsDashboards")}
          status={health.ws.dashboardClients > 0 ? "ok" : "idle"}
          detail={t("connectivity.connectedCount", { count: health.ws.dashboardClients })}
        />
      </div>
    </Card>
  );
}

function Row({
  label,
  status,
  detail,
}: {
  label: string;
  status: RowStatus;
  detail: string;
}) {
  const t = useTranslations();
  const tone =
    status === "ok"
      ? "success"
      : status === "stub"
        ? "warning"
        : status === "idle"
          ? "muted"
          : "danger";
  const labelKey =
    status === "ok"
      ? "connectivity.ok"
      : status === "stub"
        ? "connectivity.stub"
        : status === "idle"
          ? "connectivity.idle"
          : "connectivity.down";
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card-inner px-3 py-2">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
          {label}
        </p>
        <p className="text-xs text-text-dim">{detail}</p>
      </div>
      <Badge tone={tone}>{t(labelKey)}</Badge>
    </div>
  );
}
