from pydantic import BaseModel


class ReviewPayload(BaseModel):
    approved: bool
    review_note: str = ""  # 驳回时必填复验意见
