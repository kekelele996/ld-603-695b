import type { ReactNode } from "react";

const TONE_CLASS: Record<string, string> = {
  NORMAL: "tone-ok",
  AVAILABLE: "tone-ok",
  CLOSED: "tone-ok",
  REVIEWED: "tone-ok",
  ABNORMAL: "tone-danger",
  UNAVAILABLE: "tone-danger",
  OVERDUE: "tone-danger",
  CRITICAL: "tone-danger",
  HIGH: "tone-warn",
  PENDING: "tone-warn",
  REJECTED: "tone-warn",
  SUBMITTED: "tone-info",
  IN_PROGRESS: "tone-info",
  PLANNED: "tone-muted",
  LOW: "tone-muted",
  MEDIUM: "tone-info"
};

export function StatusBadge({ value, label }: { value: string; label?: ReactNode }) {
  const key = String(value ?? "");
  const tone = TONE_CLASS[key] ?? "tone-muted";
  return (
    <span className={`badge ${key.toLowerCase().replace(/_/g, "-")} ${tone}`}>
      {label ?? key.replace(/_/g, " ")}
    </span>
  );
}
