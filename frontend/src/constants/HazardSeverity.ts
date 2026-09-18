export const HazardSeverity = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type HazardSeverity = (typeof HazardSeverity)[number];
export const HazardSeverityText: Record<HazardSeverity, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  CRITICAL: "严重"
};
export const HazardSeverityRank: Record<HazardSeverity, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3
};
