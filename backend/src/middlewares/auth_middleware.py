"""轻量认证中间件：前端切换登录用户后通过 x-user-id / x-role 透传身份。

本地演示无真实 JWT 签发，但 request.state.user 的结构与 JWT + RBAC 链路一致，
service 复验时读取 user.id 做“原巡检员”校验。
"""
from src.repositories.user_repository import UserRepository

_user_repo = UserRepository()


async def auth_middleware(request, call_next):
    user_id_raw = request.headers.get("x-user-id", "1")
    user_id = int(user_id_raw) if user_id_raw.isdigit() else 1
    user = _user_repo.find_by_id(user_id) or {"id": user_id, "name": f"用户{user_id}",
                                              "role": "INSPECTOR"}
    role = request.headers.get("x-role") or user.get("role", "INSPECTOR")
    request.state.user = {"id": user["id"], "name": user.get("name", ""), "role": role}
    return await call_next(request)
