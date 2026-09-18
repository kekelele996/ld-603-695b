export interface HazardTicket {
  id: number;
  result_id: number;
  device_id: number;
  severity: string;            // LOW / MEDIUM / HIGH / CRITICAL
  owner_id: number;
  deadline: string;
  rectify_status: string;      // OPEN / RECTIFIED / REJECTED / CLOSED
  rectify_note: string;
  rectified_at: string;
  reinspect_note: string;
  closed_at: string;
  created_at: string;
  escalated: boolean;
}
