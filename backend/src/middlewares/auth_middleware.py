from src.seed import seed

# 演示用静态用户表（真实环境由 JWT 解析）：x-user-id 指定用户，角色取自用户档案
_ROLE_BY_ID = {row["id"]: row["role"] for row in seed["user"]}
_DEFAULT_USER_ID = 1


async def auth_middleware(request, call_next):
    raw_id = request.headers.get("x-user-id", str(_DEFAULT_USER_ID))
    try:
        user_id = int(raw_id)
    except (TypeError, ValueError):
        user_id = _DEFAULT_USER_ID
    role = _ROLE_BY_ID.get(user_id, "INSPECTOR")
    request.state.user = {"id": user_id, "role": role}
    return await call_next(request)
