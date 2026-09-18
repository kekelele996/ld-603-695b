import { mockData } from "../mocks/seedData";
import { request } from "./client";
import { identityHeaders } from "./session";
import type { InspectionTask } from "../types/InspectionTask";

const endpoint = "/inspection-task";

export async function listInspectionTask(): Promise<InspectionTask[]> {
  try {
    return await request<InspectionTask[]>(endpoint, { headers: identityHeaders() });
  } catch {
    // Local mock fallback keeps the UI available during offline review.
    return [...(mockData.inspectionTask as unknown as InspectionTask[])];
  }
}

export async function saveInspectionTask(payload: InspectionTask) {
  console.info("save InspectionTask", payload);
  return payload;
}
