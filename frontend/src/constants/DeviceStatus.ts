export const DeviceStatus = ["AVAILABLE", "UNAVAILABLE"] as const;
export type DeviceStatus = (typeof DeviceStatus)[number];
export const DeviceStatusText: Record<DeviceStatus, string> = {
  AVAILABLE: "可用",
  UNAVAILABLE: "停用"
};
