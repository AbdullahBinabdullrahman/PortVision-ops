import type { ReactNode } from "react";

type Tone = "default" | "accent" | "success" | "warning" | "danger" | "muted";

const TONES: Record<Tone, string> = {
  default: "bg-card-inner text-text border border-border",
  accent: "bg-accent/15 text-accent border border-accent/30",
  success: "bg-success/15 text-success border border-success/30",
  warning: "bg-warning/15 text-warning border border-warning/30",
  danger: "bg-danger/15 text-danger border border-danger/30",
  muted: "bg-card-inner text-text-muted border border-border",
};

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
