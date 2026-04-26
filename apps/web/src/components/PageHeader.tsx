import type { ReactNode } from "react";

export function PageHeader({
  label,
  title,
  subtitle,
  right,
}: {
  label: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          {label}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-text">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
