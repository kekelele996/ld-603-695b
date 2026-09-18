export const InspectionResultStatus = ["NORMAL", "ABNORMAL"] as const;
export type InspectionResultStatus = (typeof InspectionResultStatus)[number];
export const InspectionResultStatusText: Record<InspectionResultStatus, string> = {
  NORMAL: "正常",
  ABNORMAL: "异常"
};
