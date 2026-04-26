import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL, COOKIE_NAME } from "@/lib/env";

export async function POST(req: Request): Promise<Response> {
  const c = cookies().get(COOKIE_NAME);
  if (c) {
    await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Cookie: `${COOKIE_NAME}=${c.value}` },
    }).catch(() => undefined);
  }
  cookies().delete(COOKIE_NAME);
  const origin = headers().get("origin") ?? new URL(req.url).origin;
  return NextResponse.redirect(new URL("/login", origin));
}
