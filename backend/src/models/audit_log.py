from pydantic import BaseModel


class AuditLog(BaseModel):
    id: int
    actor_id: int | float
    action: str
    target_type: str
    target_id: int | float | str
    detail: str = ""
    created_at: str
