"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState("admin@portvision.local");
  const [password, setPassword] = useState("portvision");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "login_failed");
      }
      router.push("/overview");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "login_failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-glow">
        <div className="mb-6">
          <h1 className="font-mono text-2xl font-bold tracking-widest text-accent">
            {t("brand.name")}
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-text-dim">
            {t("login.headerTag")}
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label={t("login.email")}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-card-inner px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          </Field>
          <Field label={t("login.password")}>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-card-inner px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          </Field>
          {error && <p className="text-xs text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent px-4 py-2 font-mono text-sm font-semibold uppercase tracking-wider text-bg transition-colors hover:bg-accent-light disabled:opacity-50"
          >
            {loading ? t("login.submitting") : t("login.submit")}
          </button>
        </form>
        <p className="mt-6 font-mono text-[11px] text-text-dim">{t("login.devSeed")}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-widest text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
