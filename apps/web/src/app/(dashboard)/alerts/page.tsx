"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Alert } from "@portvision/shared/types";
import { useDashboardSocket } from "@/lib/ws-client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type AlertWithContainer = Alert & { container?: { isoCode: string } };

const FILTERS = [
  { id: "open", labelKey: "alerts.filterOpen" },
  { id: "acked", labelKey: "alerts.filterAcked" },
  { id: "all", labelKey: "alerts.filterAll" },
] as const;

export default function AlertsPage() {
  const t = useTranslations();
  const [alerts, setAlerts] = useState<AlertWithContainer[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "acked">("open");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const qs =
      filter === "open" ? "?acknowledged=false" : filter === "acked" ? "?acknowledged=true" : "";
    const url = `/api/v1/alerts${qs}${qs ? "&" : "?"}limit=100`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const j = (await res.json()) as { items: AlertWithContainer[] };
      setAlerts(j.items);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [filter]);

  useDashboardSocket({
    onMessage: (msg) => {
      if (msg.type === "alert.new") {
        setAlerts((prev) => [msg.payload.alert as AlertWithContainer, ...prev]);
      } else if (msg.type === "alert.acknowledged") {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === msg.payload.alert.id ? (msg.payload.alert as AlertWithContainer) : a
          )
        );
      }
    },
  });

  async function ack(id: string) {
    await fetch(`/api/v1/alerts/${id}/ack`, { method: "PATCH" });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        label={t("alerts.tag")}
        title={t("alerts.title")}
        subtitle={t("alerts.subtitle")}
        right={
          <div className="flex gap-2">
            {FILTERS.map((k) => (
              <button
                key={k.id}
                onClick={() => setFilter(k.id)}
                className={`rounded-md border px-3 py-1 font-mono text-[11px] uppercase tracking-widest ${
                  filter === k.id
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border bg-card text-text-muted hover:text-text"
                }`}
              >
                {t(k.labelKey)}
              </button>
            ))}
          </div>
        }
      />

      <Card>
        {loading && <p className="text-sm text-text-muted">{t("common.loading")}</p>}
        {!loading && alerts.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-text-muted">
            {t("alerts.noAlerts")}
          </p>
        )}
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card-inner px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    tone={
                      a.severity === "critical"
                        ? "danger"
                        : a.severity === "warn"
                          ? "warning"
                          : "muted"
                    }
                  >
                    {a.severity}
                  </Badge>
                  <span className="text-sm">{a.message}</span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-text-dim">
                  {a.container?.isoCode ?? a.containerId} ·{" "}
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
              {a.acknowledged ? (
                <Badge tone="success">{t("common.acknowledged")}</Badge>
              ) : (
                <button
                  onClick={() => ack(a.id)}
                  className="rounded-md border border-accent px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-accent hover:bg-accent/10"
                >
                  {t("common.acknowledge")}
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
