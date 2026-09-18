const TONE: Record<string, string> = {
  OPEN: "warn",
  RECTIFIED: "info",
  REJECTED: "danger",
  CLOSED: "ok",
  AVAILABLE: "ok",
  UNAVAILABLE: "danger",
  NORMAL: "ok",
  ABNORMAL: "danger",
  PLANNED: "muted",
  IN_PROGRESS: "info",
  SUBMITTED: "warn",
  REVIEWED: "ok",
  OVERDUE: "danger",
  LOCAL_DATA: "muted"
};

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  const tone = TONE[value] ?? "muted";
  return <span className={`badge badge-${tone}`}>{label ?? value}</span>;
}
