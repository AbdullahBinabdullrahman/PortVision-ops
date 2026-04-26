import { cookies } from "next/headers";

export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";

export const THEMES = [
  { id: "port-default", labelKey: "settings.themes.portDefault" },
  { id: "midnight", labelKey: "settings.themes.midnight" },
  { id: "desert", labelKey: "settings.themes.desert" },
  { id: "emerald", labelKey: "settings.themes.emerald" },
  { id: "light", labelKey: "settings.themes.light" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];
export const DEFAULT_THEME: ThemeId = "port-default";

export const LOCALE_COOKIE = "pv_locale";
export const THEME_COOKIE = "pv_theme";

export function readLocale(): Locale {
  const v = cookies().get(LOCALE_COOKIE)?.value;
  return (LOCALES as readonly string[]).includes(v ?? "") ? (v as Locale) : DEFAULT_LOCALE;
}

export function readTheme(): ThemeId {
  const v = cookies().get(THEME_COOKIE)?.value;
  return (THEMES as readonly { id: string }[]).some((t) => t.id === v)
    ? (v as ThemeId)
    : DEFAULT_THEME;
}

export function localeDir(loc: Locale): "ltr" | "rtl" {
  return loc === "ar" ? "rtl" : "ltr";
}
