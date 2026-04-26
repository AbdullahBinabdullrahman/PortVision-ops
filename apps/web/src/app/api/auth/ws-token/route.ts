import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/env";

export async function GET(): Promise<Response> {
  const c = cookies().get(COOKIE_NAME);
  if (!c) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ token: c.value });
}
