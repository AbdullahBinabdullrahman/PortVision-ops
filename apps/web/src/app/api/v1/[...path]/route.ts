import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { API_URL, COOKIE_NAME } from "@/lib/env";

async function proxy(req: NextRequest, params: { path: string[] }): Promise<Response> {
  const subpath = params.path.join("/");
  const search = req.nextUrl.search;
  const url = `${API_URL}/api/v1/${subpath}${search}`;

  const headers = new Headers();
  const ct = req.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  const c = cookies().get(COOKIE_NAME);
  if (c) headers.set("cookie", `${COOKIE_NAME}=${c.value}`);

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.text();
    if (body) init.body = body;
  }

  const upstream = await fetch(url, init);
  const resBody = await upstream.arrayBuffer();
  const res = new NextResponse(resBody, { status: upstream.status });
  const upstreamCt = upstream.headers.get("content-type");
  if (upstreamCt) res.headers.set("content-type", upstreamCt);
  return res;
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params);
}
export async function PATCH(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params);
}
export async function PUT(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params);
}
