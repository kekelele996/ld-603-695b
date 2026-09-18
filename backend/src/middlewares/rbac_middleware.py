"""RBAC 角色守卫：作为 FastAPI 依赖挂在写接口上。

隐患闭环的角色约束：
- 巡检结果提交：巡检员
- 隐患派单：巡检员/物业主管
- 整改提交：维保商/物业主管
- 复验：巡检员（且 service 层进一步校验必须是原巡检员）
"""
from fastapi import Depends, Request

from src.constants import error_codes, error_messages
from src.constants.exceptions import BusinessError


def allow_roles(*roles: str):
    def guard(request: Request) -> dict:
        user = getattr(request.state, "user", None) or {}
        if user.get("role") not in roles:
            raise BusinessError(
                error_codes.ERROR_CODES["RBAC_DENIED"],
                error_messages.ERROR_MESSAGES["RBAC_DENIED"],
                403,
            )
        return user

    return Depends(guard)
