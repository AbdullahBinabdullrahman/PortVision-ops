import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/40 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="font-mono text-sm uppercase tracking-widest text-accent">
          {title}
        </h3>
        {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
