from datetime import datetime, timezone

from src.seed import seed


class AuditLogRepository:
    """操作日志台账：巡检提交、隐患建单/整改/复验等写操作全部落账。"""

    def find_all(self):
        return seed["auditLog"]

    def append(self, actor_id, action, target_type, target_id, detail=""):
        row = {
            "id": len(seed["auditLog"]) + 1,
            "actor_id": actor_id,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "detail": detail,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        seed["auditLog"].append(row)
        return row
