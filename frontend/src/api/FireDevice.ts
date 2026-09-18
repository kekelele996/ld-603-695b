import { requestJson } from "./client";
import { mockData } from "../mocks/seedData";
import type { FireDevice } from "../types/FireDevice";

const endpoint = "/api/fire-device";

export async function listFireDevice(): Promise<FireDevice[]> {
  try {
    return await requestJson<FireDevice[]>(endpoint);
  } catch {
    // Local mock fallback keeps the UI available during offline review.
    return [...(mockData.fireDevice as unknown as FireDevice[])];
  }
}

export async function saveFireDevice(payload: FireDevice) {
  return payload;
}
