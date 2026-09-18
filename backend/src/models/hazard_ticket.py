from pydantic import BaseModel


class HazardTicket(BaseModel):
    id: int
    result_id: int
    device_id: int
    severity: str
    owner_id: int
    deadline: str
    rectify_status: str          # OPEN / RECTIFIED / REJECTED / CLOSED
    rectify_note: str
    rectified_at: str
    reinspect_note: str
    closed_at: str
    created_at: str
    escalated: bool = False
