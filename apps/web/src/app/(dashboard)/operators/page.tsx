import { getTranslations } from "next-intl/server";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/PageHeader";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

interface OperatorRow {
  id: string;
  name: string;
  role: string;
  language: string;
  active: boolean;
  headsets: { id: string; deviceModel: string; status: string }[];
  _count: { actions: number };
}

export default async function OperatorsPage() {
  const t = await getTranslations();
  const data = await apiFetch<{ items: OperatorRow[] }>("/operators", { forwardCookies: true });

  return (
    <div className="space-y-6">
      <PageHeader
        label={t("operators.tag")}
        title={t("operators.title")}
        subtitle={t("operators.subtitle")}
      />

      <Table>
        <THead>
          <TH>{t("operators.name")}</TH>
          <TH>{t("operators.role")}</TH>
          <TH>{t("operators.language")}</TH>
          <TH>{t("operators.headset")}</TH>
          <TH>{t("operators.actions")}</TH>
          <TH>{t("operators.status")}</TH>
        </THead>
        <TBody>
          {data.items.map((op) => (
            <TR key={op.id}>
              <TD className="font-medium">{op.name}</TD>
              <TD>
                <Badge tone="accent">{op.role}</Badge>
              </TD>
              <TD className="font-mono text-xs uppercase">{op.language}</TD>
              <TD>
                {op.headsets[0] ? (
                  <div>
                    <div className="text-sm">{op.headsets[0].deviceModel}</div>
                    <div className="font-mono text-[11px] text-text-dim">
                      {op.headsets[0].status}
                    </div>
                  </div>
                ) : (
                  <span className="text-text-dim">{t("common.unassigned")}</span>
                )}
              </TD>
              <TD className="font-mono text-sm">{op._count.actions}</TD>
              <TD>
                <Badge tone={op.active ? "success" : "muted"}>
                  {op.active ? t("common.active") : t("common.inactive")}
                </Badge>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
