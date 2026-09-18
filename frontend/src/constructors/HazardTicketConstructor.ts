import type { HazardTicket } from "../types/HazardTicket";

export const createDefaultHazardTicket = (overrides: Partial<HazardTicket> = {}): HazardTicket => ({
  id: 0,
  result_id: 0,
  severity: "MEDIUM",
  owner_id: 3,
  deadline: "",
  rectify_status: "PENDING",
  rectify_note: "",
  closed_at: "",
  created_at: "",
  submitted_by: null,
  review_note: "",
  inspector_id: null,
  ...overrides
});

export const createHazardTicketForm = createDefaultHazardTicket;
export const createHazardTicketResponse = createDefaultHazardTicket;

/** 异常提交表单：收敛异常判定时建单字段的默认结构 */
export const createAbnormalSubmitForm = (
  resultId: number,
  overrides: { severity?: string; deadline?: string; owner_id?: number } = {}
) => ({
  result_id: resultId,
  result_status: "ABNORMAL" as const,
  severity: "MEDIUM",
  deadline: "",
  owner_id: 3,
  ...overrides
});
