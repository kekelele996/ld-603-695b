import { mockData } from "../mocks/seedData";
import { idempotencyKey, request } from "./client";
import { identityHeaders } from "./session";
import type { HazardTicket } from "../types/HazardTicket";

const endpoint = "/hazard-ticket";

export async function listHazardTicket(): Promise<HazardTicket[]> {
  try {
    return await request<HazardTicket[]>(endpoint, { headers: identityHeaders() });
  } catch {
    // Local mock fallback keeps the UI available during offline review.
    return [...(mockData.hazardTicket as unknown as HazardTicket[])];
  }
}

export async function createHazardTicket(
  payload: { result_id: number; severity: string; owner_id: number; deadline: string },
  key: string = idempotencyKey("hazard-create")
): Promise<HazardTicket> {
  return request<HazardTicket>(endpoint, {
    method: "POST",
    headers: identityHeaders({ "Idempotency-Key": key }),
    body: JSON.stringify(payload)
  });
}

export async function submitRectification(
  ticketId: number,
  rectifyNote: string,
  key: string = idempotencyKey("hazard-rectify")
): Promise<HazardTicket> {
  return request<HazardTicket>(`${endpoint}/${ticketId}/rectify`, {
    method: "POST",
    headers: identityHeaders({ "Idempotency-Key": key }),
    body: JSON.stringify({ rectify_note: rectifyNote })
  });
}

export async function reinspectHazardTicket(
  ticketId: number,
  passed: boolean,
  reinspectNote: string,
  key: string = idempotencyKey("hazard-reinspect")
): Promise<HazardTicket> {
  return request<HazardTicket>(`${endpoint}/${ticketId}/reinspect`, {
    method: "POST",
    headers: identityHeaders({ "Idempotency-Key": key }),
    body: JSON.stringify({ passed, reinspect_note: reinspectNote })
  });
}
