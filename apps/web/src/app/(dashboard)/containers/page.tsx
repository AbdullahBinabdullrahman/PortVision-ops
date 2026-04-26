import { getTranslations } from "next-intl/server";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/PageHeader";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import type { Container } from "@portvision/shared/types";

export default async function ContainersPage() {
  const t = await getTranslations();
  const data = await apiFetch<{ items: Container[]; total: number }>("/containers?limit=100", {
    forwardCookies: true,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        label={t("containers.tag")}
        title={t("containers.title")}
        subtitle={t("containers.subtitle", { total: data.total })}
      />

      <Table>
        <THead>
          <TH>{t("containers.isoCode")}</TH>
          <TH>{t("containers.bleBeacon")}</TH>
          <TH>{t("containers.status")}</TH>
          <TH>{t("containers.cargo")}</TH>
          <TH>{t("containers.position")}</TH>
          <TH>{t("containers.lastInspected")}</TH>
        </THead>
        <TBody>
          {data.items.map((c) => (
            <TR key={c.id}>
              <TD className="font-mono text-sm">{c.isoCode}</TD>
              <TD className="font-mono text-[11px] text-text-dim">
                {c.bleBeaconId ?? t("common.dash")}
              </TD>
              <TD>
                <Badge tone={statusTone(c.status)}>{c.status}</Badge>
              </TD>
              <TD>{c.cargoType ?? t("common.dash")}</TD>
              <TD className="font-mono text-[11px] text-text-muted">
                {c.locationLat?.toFixed(5) ?? t("common.dash")},{" "}
                {c.locationLng?.toFixed(5) ?? t("common.dash")}
              </TD>
              <TD className="font-mono text-[11px] text-text-muted">
                {c.lastInspectedAt
                  ? new Date(c.lastInspectedAt).toLocaleString()
                  : t("common.never")}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

function statusTone(s: string): "default" | "accent" | "warning" | "success" | "muted" {
  if (s === "loaded") return "accent";
  if (s === "in_transit") return "warning";
  if (s === "inspection") return "success";
  return "muted";
}
