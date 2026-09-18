export interface InspectionResult {
  id: number;
  task_id: number;
  device_id: number;
  item_code: string;
  result_status: string; // InspectionResultStatus: NORMAL / ABNORMAL
  measured_value: string;
  photo_url: string;
  note: string;
  submitted?: boolean;
  inspector_id?: number | null;
}

export interface InspectionResultSubmitPayload {
  result_id: number;
  result_status: "NORMAL" | "ABNORMAL";
  measured_value?: string;
  note?: string;
  severity?: string;
  deadline?: string;
  owner_id?: number;
}

export interface InspectionResultSubmitResponse {
  result: InspectionResult;
  hazard: { id: number; rectify_status: string } | null;
  replayed: boolean;
}
