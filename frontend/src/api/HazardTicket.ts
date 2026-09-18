import { requestJson } from "./client";
import { mockData } from "../mocks/seedData";
import type { HazardTicket } from "../types/HazardTicket";

const endpoint = "/api/hazard-ticket";

export async function listHazardTicket(status = ""): Promise<HazardTicket[]> {
  try {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return await requestJson<HazardTicket[]>(`${endpoint}${query}`);
  } catch {
    // Local mock fallback keeps the UI available during offline review.
    const rows = mockData.hazardTicket as unknown as HazardTicket[];
    return status ? rows.filter((row) => row.rectify_status === status) : [...rows];
  }
}

export async function submitRectify(ticketId: number, rectifyNote: string): Promise<HazardTicket> {
  return requestJson<HazardTicket>(`${endpoint}/${ticketId}/rectify`, {
    method: "POST",
    body: JSON.stringify({ rectify_note: rectifyNote })
  });
}

export async function reviewHazardTicket(
  ticketId: number,
  approved: boolean,
  reviewNote: string
): Promise<HazardTicket> {
  return requestJson<HazardTicket>(`${endpoint}/${ticketId}/review`, {
    method: "POST",
    body: JSON.stringify({ approved, review_note: reviewNote })
  });
}

export async function saveHazardTicket(payload: HazardTicket) {
  return payload;
}
