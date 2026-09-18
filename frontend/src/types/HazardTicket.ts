export interface HazardTicket {
  id: number;
  result_id: number;
  severity: string;
  owner_id: number;
  deadline: string;
  rectify_status: string; // RectifyStatus: PENDING/SUBMITTED/REJECTED/CLOSED
  rectify_note: string;
  closed_at: string;
  created_at?: string;
  submitted_by?: number | null;
  review_note?: string;
  inspector_id?: number | null;
}

export interface RectifyFormPayload {
  rectify_note: string;
}

export interface ReviewFormPayload {
  approved: boolean;
  review_note: string;
}
