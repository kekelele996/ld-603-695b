from pydantic import BaseModel


class HazardTicketPayload(BaseModel):
    rectify_note: str  # 整改说明，必填
