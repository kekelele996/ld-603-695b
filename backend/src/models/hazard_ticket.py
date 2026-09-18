from pydantic import BaseModel


class HazardTicket(BaseModel):
    id: int | float
    result_id: int | float
    severity: str
    owner_id: int | float
    deadline: str
    rectify_status: str
    rectify_note: str
    closed_at: str
    created_at: str = ""
    submitted_by: int | float | None = None
    review_note: str = ""
    inspector_id: int | float | None = None
