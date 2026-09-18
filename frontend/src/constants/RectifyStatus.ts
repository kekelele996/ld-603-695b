export const RectifyStatus = ["PENDING", "SUBMITTED", "REJECTED", "CLOSED"] as const;
export type RectifyStatus = (typeof RectifyStatus)[number];
export const RectifyStatusText: Record<RectifyStatus, string> = {
  PENDING: "待整改",
  SUBMITTED: "待复验",
  REJECTED: "复验驳回",
  CLOSED: "已关闭"
};

// 有效隐患单状态：同一巡检结果在这些状态下只允许一张隐患单
export const ACTIVE_RECTIFY_STATUSES: RectifyStatus[] = ["PENDING", "SUBMITTED", "REJECTED"];
