export const InspectionStatus = ["PLANNED","IN_PROGRESS","SUBMITTED","REVIEWED","OVERDUE"] as const;
export type InspectionStatus = (typeof InspectionStatus)[number];
export const InspectionStatusText: Record<InspectionStatus, string> = {
  PLANNED: "已排期",
  IN_PROGRESS: "巡检中",
  SUBMITTED: "已提交",
  REVIEWED: "已复核",
  OVERDUE: "已逾期"
};
