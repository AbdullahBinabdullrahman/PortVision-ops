import { cookies } from "next/headers";
import { API_URL, COOKIE_NAME } from "./env";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  // Pass when calling from a Server Component / Route Handler so we forward the cookie.
  forwardCookies?: boolean;
}

export async function apiFetch<T = unknown>(path: string, opts: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };

  if (opts.forwardCookies) {
    const c = cookies().get(COOKIE_NAME);
    if (c) headers.Cookie = `${COOKIE_NAME}=${c.value}`;
  }

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...opts,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, msg);
  }
  return (await res.json()) as T;
}
