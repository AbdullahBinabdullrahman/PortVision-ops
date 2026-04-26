import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_URL, COOKIE_NAME } from "./env";

export interface SessionUser {
  id: string;
  email: string;
  role: "admin" | "viewer";
  createdAt: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const c = cookies().get(COOKIE_NAME);
  if (!c) return null;
  const res = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: { Cookie: `${COOKIE_NAME}=${c.value}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { user: SessionUser };
  return data.user;
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
