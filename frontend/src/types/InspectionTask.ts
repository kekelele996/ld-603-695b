export interface InspectionTask {
  id: number;
  building_id: number;
  inspector_id: number;
  plan_date: string;
  task_type: string;
  status: string;              // PLANNED / IN_PROGRESS / SUBMITTED / REVIEWED / OVERDUE
  checklist_version: string;
  finished_at: string;
  device_ids: number[];
}
