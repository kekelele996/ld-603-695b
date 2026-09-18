from pydantic import BaseModel


class InspectionResult(BaseModel):
    id: int
    task_id: int
    device_id: int
    item_code: str
    result_status: str           # NORMAL / ABNORMAL
    measured_value: str
    photo_url: str
    note: str
    created_at: str
