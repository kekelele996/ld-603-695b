from typing import Literal

from pydantic import BaseModel, Field


class HazardCreatePayload(BaseModel):
    """异常巡检结果转隐患单的派单参数。"""
    result_id: int
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = "MEDIUM"
    owner_id: int
    deadline: str = Field(min_length=1)
    note: str = ""


class HazardRectifyPayload(BaseModel):
    """整改责任人提交整改说明。"""
    rectify_note: str = Field(min_length=1)


class HazardReinspectPayload(BaseModel):
    """原巡检员复验结论。"""
    passed: bool
    reinspect_note: str = ""