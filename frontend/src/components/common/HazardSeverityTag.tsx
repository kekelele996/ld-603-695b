import { HazardSeverityText } from "../../constants/HazardSeverity";
import { formatRisk } from "../../utils/formatters";
import { StatusBadge } from "./StatusBadge";

export function HazardSeverityTag({ value, overdue = false }: { value: string; overdue?: boolean }) {
  const text = HazardSeverityText[value as keyof typeof HazardSeverityText] ?? formatRisk(value);
  return (
    <span className="severity-tag">
      <StatusBadge value={value} label={text} />
      {overdue && <em className="overdue-flag">逾期自动升级</em>}
    </span>
  );
}
