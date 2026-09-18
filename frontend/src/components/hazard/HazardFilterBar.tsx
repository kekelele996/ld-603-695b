import { RectifyStatus, RectifyStatusText } from "../../constants/RectifyStatus";

export type HazardFilter = "ALL" | "OPEN" | "RECTIFIED" | "REJECTED" | "CLOSED";

const FILTERS: HazardFilter[] = ["ALL", ...RectifyStatus];

export function HazardFilterBar({ value, onChange, counts }: {
  value: HazardFilter;
  onChange: (value: HazardFilter) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="filter-bar" role="tablist">
      {FILTERS.map((key) => (
        <button
          key={key}
          role="tab"
          aria-selected={value === key}
          className={`chip ${value === key ? "active" : ""}`}
          onClick={() => onChange(key)}
        >
          {key === "ALL" ? "全部" : RectifyStatusText[key]}
          <span className="chip-count">{counts[key] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
