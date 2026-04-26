import { getTranslations } from "next-intl/server";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/PageHeader";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import type { Action, Alert } from "@portvision/shared/types";

export default async function ActivityPage() {
  const t = await getTranslations();
  const [actions, alerts] = await Promise.all([
    apiFetch<{ items: (Action & { operator?: { name: string }; container?: { isoCode: string } })[] }>(
      "/actions?limit=50",
      { forwardCookies: true }
    ),
    apiFetch<{ items: (Alert & { container?: { isoCode: string } })[] }>(
      "/alerts?limit=30",
      { forwardCookies: true }
    ),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        label={t("activity.tag")}
        title={t("activity.title")}
        subtitle={t("activity.subtitle")}
      />
      <LiveActivityFeed initialActions={actions.items} initialAlerts={alerts.items} />
    </div>
  );
}
