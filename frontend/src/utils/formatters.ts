import { DeviceStatusText } from "../constants/DeviceStatus";
import { DeviceTypeText } from "../constants/DeviceType";
import { HazardSeverityText } from "../constants/HazardSeverity";
import { InspectionResultStatusText } from "../constants/InspectionResultStatus";
import { RectifyStatusText } from "../constants/RectifyStatus";
import { ROLE_TEXT } from "../constants/users";

export const formatDate = (value: string) =>
  value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "—";

export const formatDay = (value: string) =>
  value ? new Date(value).toLocaleDateString("zh-CN") : "—";

export const formatStatus = (value: string) => value.replace(/_/g, " ");

export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);

export const formatRisk = (value: string) =>
  HazardSeverityText[value as keyof typeof HazardSeverityText] ?? value;

export const formatDeviceType = (value: string) =>
  DeviceTypeText[value as keyof typeof DeviceTypeText] ?? value;

export const formatDeviceStatus = (value: string) =>
  DeviceStatusText[value as keyof typeof DeviceStatusText] ?? value;

export const formatRectifyStatus = (value: string) =>
  RectifyStatusText[value as keyof typeof RectifyStatusText] ?? value;

export const formatResultStatus = (value: string) =>
  InspectionResultStatusText[value as keyof typeof InspectionResultStatusText] ?? value;

export const formatRole = (value: string) =>
  ROLE_TEXT[value as keyof typeof ROLE_TEXT] ?? value;
