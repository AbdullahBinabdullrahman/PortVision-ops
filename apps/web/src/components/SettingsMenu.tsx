"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const LOCALES = [
  { id: "ar", labelKey: "settings.languages.ar" },
  { id: "en", labelKey: "settings.languages.en" },
] as const;

const THEMES = [
  { id: "port-default", labelKey: "settings.themes.portDefault", swatch: "#20808D" },
  { id: "midnight", labelKey: "settings.themes.midnight", swatch: "#6366F1" },
  { id: "desert", labelKey: "settings.themes.desert", swatch: "#D98A43" },
  { id: "emerald", labelKey: "settings.themes.emerald", swatch: "#10B981" },
  { id: "light", labelKey: "settings.themes.light", swatch: "#0E7480" },
] as const;

export function SettingsMenu({
  currentLocale,
  currentTheme,
}: {
  currentLocale: string;
  currentTheme: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  async function save(patch: { locale?: string; theme?: string }) {
    setBusy(true);
    try {
      // Optimistic: apply theme to <html> so the user sees it immediately.
      if (patch.theme) {
        document.documentElement.setAttribute("data-theme", patch.theme);
      }
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md border border-border bg-card-inner px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-text-muted transition-colors hover:border-accent hover:text-accent"
        aria-expanded={open}
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
        {t("settings.openButton")}
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 w-[260px] rounded-lg border border-border bg-card p-3 shadow-glow ltr:left-0 rtl:right-0">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-text-dim">
            {t("settings.language")}
          </p>
          <div className="mb-3 grid grid-cols-2 gap-1.5">
            {LOCALES.map((l) => (
              <button
                key={l.id}
                disabled={busy}
                onClick={() => void save({ locale: l.id })}
                className={`rounded-md border px-2 py-1.5 text-xs ${
                  currentLocale === l.id
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border bg-card-inner text-text-muted hover:border-accent/40 hover:text-text"
                }`}
              >
                {t(l.labelKey)}
              </button>
            ))}
          </div>

          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-text-dim">
            {t("settings.palette")}
          </p>
          <div className="space-y-1">
            {THEMES.map((th) => (
              <button
                key={th.id}
                disabled={busy}
                onClick={() => void save({ theme: th.id })}
                className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-xs ${
                  currentTheme === th.id
                    ? "border-accent bg-accent/10 text-text"
                    : "border-border bg-card-inner text-text-muted hover:border-accent/40 hover:text-text"
                }`}
              >
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-border"
                  style={{ background: th.swatch }}
                />
                <span>{t(th.labelKey)}</span>
                {currentTheme === th.id && (
                  <span className="ms-auto font-mono text-[10px] text-accent">●</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
