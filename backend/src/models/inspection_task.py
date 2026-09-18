from pydantic import BaseModel


class InspectionTask(BaseModel):
    id: int
    building_id: int
    inspector_id: int
    plan_date: str
    task_type: str
    status: str                  # PLANNED / IN_PROGRESS / SUBMITTED / REVIEWED / OVERDUE
    checklist_version: str
    finished_at: str
    device_ids: list[int] = []
