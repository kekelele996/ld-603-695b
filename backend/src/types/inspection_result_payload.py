from pydantic import BaseModel


class InspectionResultPayload(BaseModel):
    result_id: int
    result_status: str  # NORMAL / ABNORMAL
    measured_value: str = ""
    note: str = ""
    severity: str = ""  # ABNORMAL 时必填：LOW/MEDIUM/HIGH/CRITICAL
    deadline: str = ""  # ABNORMAL 时必填，ISO 时间
    owner_id: int = 0   # 整改责任人，缺省落到默认维保商
