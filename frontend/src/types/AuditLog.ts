export interface AuditLog {
  id: number;
  actor_id: number;
  action: string;
  target_type: string;
  target_id: number | string;
  detail: string;
  created_at: string;
}
