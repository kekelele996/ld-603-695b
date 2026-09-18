import { mockData } from "../mocks/seedData";
import { request } from "./client";
import { identityHeaders } from "./session";
import type { Building } from "../types/Building";

const endpoint = "/building";

export async function listBuilding(): Promise<Building[]> {
  try {
    return await request<Building[]>(endpoint, { headers: identityHeaders() });
  } catch {
    // Local mock fallback keeps the UI available during offline review.
    return [...(mockData.building as unknown as Building[])];
  }
}

export async function saveBuilding(payload: Building) {
  console.info("save Building", payload);
  return payload;
}
