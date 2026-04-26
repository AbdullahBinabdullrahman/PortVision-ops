import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL, COOKIE_NAME } from "@/lib/env";

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    return NextResponse.json(
      { error: j.error ?? "login_failed" },
      { status: res.status }
    );
  }
  const data = (await res.json()) as {
    token: string;
    user: { id: string; email: string; role: string };
  };

  cookies().set(COOKIE_NAME, data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ user: data.user });
}
