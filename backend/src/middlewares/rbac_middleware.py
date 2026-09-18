from fastapi import HTTPException, Request

from src.constants.error_codes import ERROR_CODES


def current_user(request: Request) -> dict:
    return getattr(request.state, "user", {"id": 1, "role": "INSPECTOR"})


def allow_roles(*roles):
    """RBAC 依赖工厂：只有指定角色可执行该写操作，否则返回 RBAC_DENIED。"""

    def dependency(request: Request) -> dict:
        user = current_user(request)
        if user["role"] not in roles:
            raise HTTPException(
                status_code=403,
                detail={"code": ERROR_CODES["RBAC_DENIED"], "message": "role denied"}
            )
        return user

    return dependency
