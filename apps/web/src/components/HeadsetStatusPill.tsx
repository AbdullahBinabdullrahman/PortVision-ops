"use client";

import { useTranslations } from "next-intl";
import { Badge } from "./ui/Badge";

export function HeadsetStatusPill({
  status,
  link,
  battery,
}: {
  status: "online" | "offline" | "charging";
  link: "5g" | "wifi" | "offline";
  battery: number;
}) {
  const t = useTranslations();
  const statusTone =
    status === "online" ? "success" : status === "charging" ? "warning" : "muted";
  const linkTone = link === "5g" ? "accent" : link === "wifi" ? "default" : "muted";
  const statusLabel =
    status === "online"
      ? t("common.online")
      : status === "charging"
        ? t("common.charging")
        : t("common.offline");

  return (
    <span className="inline-flex items-center gap-2">
      <Badge tone={statusTone}>{statusLabel}</Badge>
      <Badge tone={linkTone}>{link.toUpperCase()}</Badge>
      <span className="font-mono text-xs text-text-muted">{battery}%</span>
    </span>
  );
}
