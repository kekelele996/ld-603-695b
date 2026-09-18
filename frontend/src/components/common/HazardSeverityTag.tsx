import { HazardSeverityText } from "../../constants/HazardSeverity";
import { StatusBadge } from "./StatusBadge";

const TONE: Record<string, string> = {
  LOW: "ok",
  MEDIUM: "info",
  HIGH: "warn",
  CRITICAL: "danger"
};

export function HazardSeverityTag({ value, escalated = false }: { value: string; escalated?: boolean }) {
  const text = HazardSeverityText[value as keyof typeof HazardSeverityText] ?? value;
  const tone = TONE[value] ?? "muted";
  return (
    <span className="severity">
      <span className={`badge badge-${tone}`}>{text}</span>
      {escalated && <em className="escalated">逾期已升级</em>}
    </span>
  );
}
