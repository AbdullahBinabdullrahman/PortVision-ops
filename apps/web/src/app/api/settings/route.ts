import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LOCALES, LOCALE_COOKIE, THEMES, THEME_COOKIE } from "@/lib/settings";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    locale?: string;
    theme?: string;
  };

  const jar = cookies();

  if (body.locale && (LOCALES as readonly string[]).includes(body.locale)) {
    jar.set(LOCALE_COOKIE, body.locale, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
    });
  }
  if (body.theme && THEMES.some((t) => t.id === body.theme)) {
    jar.set(THEME_COOKIE, body.theme, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
    });
  }

  return NextResponse.json({ ok: true });
}
