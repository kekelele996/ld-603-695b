from typing import Literal

from pydantic import BaseModel, Field


class InspectionResultSubmitPayload(BaseModel):
    """巡检员录入一个检查项；ABNORMAL 时在同一事务内生成隐患单并停用设备。"""
    task_id: int
    device_id: int
    item_code: str = Field(min_length=1)
    result_status: Literal["NORMAL", "ABNORMAL"]
    measured_value: str = ""
    photo_url: str = ""
    note: str = ""
    # 异常时的隐患派单参数（result_status=ABNORMAL 必填）
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = "MEDIUM"
    owner_id: int | None = None
    deadline: str = ""
