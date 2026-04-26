"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { SettingsMenu } from "./SettingsMenu";

const NAV = [
  { href: "/overview", labelKey: "nav.overview", icon: "M3 12l9-9 9 9M5 10v10h14V10" },
  { href: "/live-map", labelKey: "nav.liveMap", icon: "M1 6l7-3 8 3 7-3v15l-7 3-8-3-7 3z" },
  { href: "/headsets", labelKey: "nav.headsets", icon: "M2 10a8 8 0 0116 0v8h-3v-6a5 5 0 00-10 0v6H2z" },
  { href: "/operators", labelKey: "nav.operators", icon: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8z" },
  { href: "/containers", labelKey: "nav.containers", icon: "M3 7l9-4 9 4-9 4-9-4zM3 12l9 4 9-4M3 17l9 4 9-4" },
  { href: "/activity", labelKey: "nav.activity", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  { href: "/iot", labelKey: "nav.iot", icon: "M4.93 4.93a10 10 0 0114.14 0M7.76 7.76a6 6 0 018.48 0M12 14a1 1 0 100-2 1 1 0 000 2z" },
  { href: "/alerts", labelKey: "nav.alerts", icon: "M12 2L2 22h20L12 2zM12 9v5M12 17v.01" },
  { href: "/analytics", labelKey: "nav.analytics", icon: "M3 3v18h18M7 14l4-4 4 4 5-5" },
];

export function Sidebar({
  email,
  locale,
  theme,
}: {
  email: string;
  locale: string;
  theme: string;
}) {
  const t = useTranslations();
  const path = usePathname();
  return (
    <aside className="fixed top-0 z-50 flex h-screen w-[220px] flex-col border-border bg-bg/95 py-6 backdrop-blur ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l">
      <div className="mb-4 border-b border-border px-5 pb-5">
        <h2 className="font-mono text-base font-bold tracking-widest text-accent">
          {t("brand.name")}
        </h2>
        <p className="mt-1 font-mono text-[10px] tracking-wide text-text-dim">
          {t("brand.shortTag")}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = path?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium transition-colors ltr:border-l-[3px] rtl:border-r-[3px] ${
                active
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-transparent text-text-muted hover:bg-accent/5 hover:text-text"
              }`}
            >
              <svg
                className="h-4 w-4 shrink-0 opacity-70"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={item.icon} />
              </svg>
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 border-t border-border px-5 pt-4">
        <SettingsMenu currentLocale={locale} currentTheme={theme} />
        <div>
          <p className="truncate font-mono text-[11px] text-text-dim">{email}</p>
          <form action="/logout" method="post" className="mt-2">
            <button
              type="submit"
              className="font-mono text-[11px] text-text-muted underline-offset-2 hover:text-accent hover:underline"
            >
              {t("nav.signOut")}
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
