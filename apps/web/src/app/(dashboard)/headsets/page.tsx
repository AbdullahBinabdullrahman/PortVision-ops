import { getTranslations } from "next-intl/server";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/PageHeader";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { HeadsetStatusPill } from "@/components/HeadsetStatusPill";
import { Badge } from "@/components/ui/Badge";

interface HeadsetRow {
  id: string;
  deviceModel: string;
  serialNumber: string;
  batteryLevel: number;
  status: "online" | "offline" | "charging";
  link: "5g" | "wifi" | "offline";
  rssi: number | null;
  lastSeenAt: string | null;
  connected: boolean;
  operator: { id: string; name: string; role: string } | null;
}

export default async function HeadsetsPage() {
  const t = await getTranslations();
  const data = await apiFetch<{ items: HeadsetRow[] }>("/headsets", { forwardCookies: true });

  return (
    <div className="space-y-6">
      <PageHeader
        label={t("headsets.tag")}
        title={t("headsets.title")}
        subtitle={t("headsets.subtitle")}
      />

      <Table>
        <THead>
          <TH>{t("headsets.device")}</TH>
          <TH>{t("headsets.serial")}</TH>
          <TH>{t("headsets.operator")}</TH>
          <TH>{t("headsets.status")}</TH>
          <TH>{t("headsets.linkRssi")}</TH>
          <TH>{t("headsets.lastSeen")}</TH>
        </THead>
        <TBody>
          {data.items.map((h) => (
            <TR key={h.id}>
              <TD>
                <div className="font-medium">{h.deviceModel}</div>
                <div className="font-mono text-[11px] text-text-dim">
                  {h.connected ? (
                    <Badge tone="success">{t("common.wsConnected")}</Badge>
                  ) : (
                    <Badge tone="muted">{t("common.offline")}</Badge>
                  )}
                </div>
              </TD>
              <TD className="font-mono text-xs">{h.serialNumber}</TD>
              <TD>
                {h.operator ? (
                  <div>
                    <div className="text-sm">{h.operator.name}</div>
                    <div className="font-mono text-[11px] text-text-dim">{h.operator.role}</div>
                  </div>
                ) : (
                  <span className="text-text-dim">{t("common.dash")}</span>
                )}
              </TD>
              <TD>
                <HeadsetStatusPill status={h.status} link={h.link} battery={h.batteryLevel} />
              </TD>
              <TD>
                <div className="font-mono text-xs">
                  {h.link.toUpperCase()}{" "}
                  <span className="text-text-dim">{h.rssi !== null ? `${h.rssi} dBm` : ""}</span>
                </div>
              </TD>
              <TD className="font-mono text-[11px] text-text-muted">
                {h.lastSeenAt ? new Date(h.lastSeenAt).toLocaleString() : t("common.never")}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
