import type { InspectionResult } from "../types/InspectionResult";

export const createDefaultInspectionResult = (overrides: Partial<InspectionResult> = {}): InspectionResult => ({
  id: 0,
  task_id: 0,
  device_id: 0,
  item_code: "",
  result_status: "NORMAL",
  measured_value: "",
  photo_url: "",
  note: "",
  created_at: "",
  ...overrides
});

export const createInspectionResultForm = createDefaultInspectionResult;
export const createInspectionResultResponse = createDefaultInspectionResult;
