"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Action, Alert } from "@portvision/shared/types";
import { useDashboardSocket } from "@/lib/ws-client";
import { Card, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";

type Tone = "default" | "accent" | "success" | "warning" | "danger" | "muted";
type Kind = "action" | "alert" | "headset";

interface FeedItem {
  id: string;
  kind: Kind;
  title: string;
  detail: string;
  ts: number;
  tone: Tone;
}

export function LiveActivityFeed({
  initialActions,
  initialAlerts,
}: {
  initialActions: (Action & { operator?: { name: string }; container?: { isoCode: string } })[];
  initialAlerts: (Alert & { container?: { isoCode: string } })[];
}) {
  const t = useTranslations();

  const seed: FeedItem[] = [
    ...initialActions.map<FeedItem>((a) => ({
      id: `action-${a.id}`,
      kind: "action",
      title: `${a.actionType.toUpperCase()} · ${a.container?.isoCode ?? ""}`,
      detail: a.operator?.name ?? "",
      ts: new Date(a.createdAt).getTime(),
      tone: "accent",
    })),
    ...initialAlerts.map<FeedItem>((a) => ({
      id: `alert-${a.id}`,
      kind: "alert",
      title: `${a.severity.toUpperCase()}: ${a.message}`,
      detail: a.container?.isoCode ?? "",
      ts: new Date(a.createdAt).getTime(),
      tone:
        a.severity === "critical" ? "danger" : a.severity === "warn" ? "warning" : "muted",
    })),
  ]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 30);

  const [items, setItems] = useState<FeedItem[]>(seed);
  const { connected } = useDashboardSocket({
    onMessage: (msg) => {
      if (msg.type === "action.created") {
        const a = msg.payload.action;
        setItems((prev) =>
          [
            {
              id: `action-${a.id}`,
              kind: "action" as const,
              title: a.actionType.toUpperCase(),
              detail: a.actionType,
              ts: new Date(a.createdAt).getTime(),
              tone: "accent" as const,
            },
            ...prev,
          ].slice(0, 50)
        );
      } else if (msg.type === "alert.new") {
        const a = msg.payload.alert;
        setItems((prev) =>
          [
            {
              id: `alert-${a.id}`,
              kind: "alert" as const,
              title: `${a.severity.toUpperCase()}: ${a.message}`,
              detail: "",
              ts: new Date(a.createdAt).getTime(),
              tone: (a.severity === "critical"
                ? "danger"
                : a.severity === "warn"
                  ? "warning"
                  : "muted") as Tone,
            },
            ...prev,
          ].slice(0, 50)
        );
      } else if (msg.type === "headset.status") {
        setItems((prev) =>
          [
            {
              id: `hs-${msg.payload.headsetId}-${Date.now()}`,
              kind: "headset" as const,
              title: t("activity.headsetStatus", { status: msg.payload.status }),
              detail: `${msg.payload.link.toUpperCase()} • ${msg.payload.battery}% • RSSI ${msg.payload.rssi ?? "—"}`,
              ts: Date.now(),
              tone: (msg.payload.status === "online" ? "success" : "muted") as Tone,
            },
            ...prev,
          ].slice(0, 50)
        );
      }
    },
  });

  function kindLabel(k: Kind): string {
    return k === "action"
      ? t("activity.kindAction")
      : k === "alert"
        ? t("activity.kindAlert")
        : t("activity.kindHeadset");
  }

  return (
    <Card>
      <CardHeader
        title={t("activity.feedTitle")}
        subtitle={t("activity.feedSubtitle")}
        right={
          <Badge tone={connected ? "success" : "muted"}>
            {connected ? t("common.wsLive") : t("common.wsOffline")}
          </Badge>
        }
      />
      <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {items.length === 0 && (
          <li className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-text-muted">
            {t("activity.waiting")}{" "}
            <code className="font-mono text-accent">pnpm sim:start</code>
          </li>
        )}
        {items.map((it) => (
          <li
            key={it.id}
            className="rounded-lg border border-border bg-card-inner px-3 py-2"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-text">{it.title}</span>
              <Badge tone={it.tone}>{kindLabel(it.kind)}</Badge>
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-text-dim">
              <span>{it.detail}</span>
              <span>{new Date(it.ts).toLocaleTimeString()}</span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
