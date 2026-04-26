import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { requireSession } from "@/lib/auth";
import { readLocale, readTheme } from "@/lib/settings";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireSession();
  const locale = readLocale();
  const theme = readTheme();
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar email={user.email} locale={locale} theme={theme} />
      <main className="min-h-screen px-10 py-10 ltr:ml-[220px] rtl:mr-[220px]">{children}</main>
    </div>
  );
}
