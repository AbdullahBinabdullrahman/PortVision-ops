import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  hint,
  right,
}: {
  label: string;
  value: string | number;
  hint?: string;
  right?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
            {label}
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold text-text">{value}</p>
          {hint && <p className="mt-1 text-xs text-text-dim">{hint}</p>}
        </div>
        {right && <div>{right}</div>}
      </div>
    </div>
  );
}
