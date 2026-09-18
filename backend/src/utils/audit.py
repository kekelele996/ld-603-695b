"""操作日志：所有隐患写操作都经此处落台账，并同步打印审计行。"""
import datetime

from src.repositories.store import store


def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def audit(action: str, template: str, user_id: int | None = None,
          detail: dict | None = None) -> dict:
    entry = {
        "id": len(store.table("auditLog")) + 1,
        "action": action,
        "template": template,
        "user_id": user_id,
        "detail": detail or {},
        "created_at": _now()
    }
    store.table("auditLog").append(entry)
    print(f"[audit] {template} by user={user_id} {entry['detail']}")
    return entry
