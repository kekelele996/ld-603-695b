export const RectifyStatus = ["OPEN", "RECTIFIED", "REJECTED", "CLOSED"] as const;
export type RectifyStatus = (typeof RectifyStatus)[number];
export const RectifyStatusText: Record<RectifyStatus, string> = {
  OPEN: "待整改",
  RECTIFIED: "待复验",
  REJECTED: "复验驳回",
  CLOSED: "已关闭"
};
