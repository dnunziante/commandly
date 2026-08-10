import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`.trim()}>{children}</section>;
}

export function StatusPill({ children, tone = "success" }: { children: ReactNode; tone?: "success" | "neutral" }) {
  return <span className={`status-pill status-pill-${tone}`}>{children}</span>;
}

export function IconTile({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "violet" | "amber" | "green" }) {
  return <span className={`icon-tile icon-tile-${tone}`} aria-hidden="true">{children}</span>;
}
