import { mockData } from "../mocks/seedData";
import { idempotencyKey, request } from "./client";
import { identityHeaders } from "./session";
import type { InspectionResult } from "../types/InspectionResult";

const endpoint = "/inspection-result";

export type SubmitResultPayload = {
  task_id: number;
  device_id: number;
  item_code: string;
  result_status: "NORMAL" | "ABNORMAL";
  measured_value?: string;
  photo_url?: string;
  note?: string;
  severity?: string;
  owner_id?: number;
  deadline?: string;
};

export type SubmitResultResponse =
  | InspectionResult
  | (InspectionResult & {
      result: InspectionResult;
      hazard_ticket: { id: number; result_id: number; device_id: number; severity: string };
    });

export async function listInspectionResult(): Promise<InspectionResult[]> {
  try {
    return await request<InspectionResult[]>(endpoint, { headers: identityHeaders() });
  } catch {
    // Local mock fallback keeps the UI available during offline review.
    return [...(mockData.inspectionResult as unknown as InspectionResult[])];
  }
}

// key 由表单在打开时生成一次：提交失败重试/刷新重放沿用同一键，只生效一次
export async function submitInspectionResult(
  payload: SubmitResultPayload,
  key: string = idempotencyKey("result-submit")
): Promise<SubmitResultResponse> {
  return request<SubmitResultResponse>(`${endpoint}/submit`, {
    method: "POST",
    headers: identityHeaders({ "Idempotency-Key": key }),
    body: JSON.stringify(payload)
  });
}
