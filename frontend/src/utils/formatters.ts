import { DeviceTypeText } from "../constants/DeviceType";
import { DeviceStatusText } from "../constants/DeviceStatus";
import { HazardSeverityText } from "../constants/HazardSeverity";
import { InspectionStatusText } from "../constants/InspectionStatus";
import { InspectionResultStatusText } from "../constants/InspectionResultStatus";
import { RectifyStatusText } from "../constants/RectifyStatus";

export const formatDate = (value: string) =>
  value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "—";

export const formatStatus = (value: string) =>
  RectifyStatusText[value as keyof typeof RectifyStatusText]
  || InspectionResultStatusText[value as keyof typeof InspectionResultStatusText]
  || DeviceStatusText[value as keyof typeof DeviceStatusText]
  || InspectionStatusText[value as keyof typeof InspectionStatusText]
  || value.replace(/_/g, " ");

export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);

export const formatRisk = (value: string) =>
  HazardSeverityText[value as keyof typeof HazardSeverityText] ?? value;

export const formatDeviceType = (value: string) =>
  DeviceTypeText[value as keyof typeof DeviceTypeText] ?? value;

export const isOverdue = (deadline: string, now = Date.now()) =>
  Boolean(deadline) && new Date(deadline).getTime() < now;
