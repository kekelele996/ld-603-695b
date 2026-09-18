import { mockData } from "../mocks/seedData";
import { request } from "./client";
import { identityHeaders } from "./session";
import type { FireDevice } from "../types/FireDevice";

const endpoint = "/fire-device";

export async function listFireDevice(): Promise<FireDevice[]> {
  try {
    return await request<FireDevice[]>(endpoint, { headers: identityHeaders() });
  } catch {
    // Local mock fallback keeps the UI available during offline review.
    return [...(mockData.fireDevice as unknown as FireDevice[])];
  }
}

export async function saveFireDevice(payload: FireDevice) {
  console.info("save FireDevice", payload);
  return payload;
}
