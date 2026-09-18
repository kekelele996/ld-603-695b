import { requestJson } from "./client";
import { mockData } from "../mocks/seedData";
import type {
  InspectionResult,
  InspectionResultSubmitPayload,
  InspectionResultSubmitResponse
} from "../types/InspectionResult";

const endpoint = "/api/inspection-result";

export async function listInspectionResult(): Promise<InspectionResult[]> {
  try {
    return await requestJson<InspectionResult[]>(endpoint);
  } catch {
    // Local mock fallback keeps the UI available during offline review.
    return [...(mockData.inspectionResult as unknown as InspectionResult[])];
  }
}

/**
 * 提交巡检结果判定。
 * @param idempotencyKey 同一意图保持稳定（页面按结果 id 生成），刷新重放只生效一次
 */
export async function submitInspectionResult(
  payload: InspectionResultSubmitPayload,
  idempotencyKey: string
): Promise<InspectionResultSubmitResponse> {
  return requestJson<InspectionResultSubmitResponse>(`${endpoint}/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Idempotency-Key": idempotencyKey }
  });
}

export async function saveInspectionResult(payload: InspectionResult) {
  return payload;
}
