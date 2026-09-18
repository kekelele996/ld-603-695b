import { requestJson } from "./client";
import type { AuditLog } from "../types/AuditLog";

const endpoint = "/api/audit-log";

export async function listAuditLog(): Promise<AuditLog[]> {
  return requestJson<AuditLog[]>(endpoint);
}
