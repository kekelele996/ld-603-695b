"""隐患单构造器：统一新建对象与响应 DTO 的默认结构，service 不散写字段。"""
import datetime


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def create_hazard_ticket_row(*, ticket_id: int, result_id: int, device_id: int,
                             severity: str, owner_id: int, deadline: str) -> dict:
    return {
        "id": ticket_id,
        "result_id": result_id,
        "device_id": device_id,
        "severity": severity,
        "owner_id": owner_id,
        "deadline": deadline,
        "rectify_status": "OPEN",
        "rectify_note": "",
        "rectified_at": "",
        "reinspect_note": "",
        "closed_at": "",
        "created_at": now_iso(),
        "escalated": False
    }


def create_hazard_ticket_response(row: dict) -> dict:
    """响应 DTO：台账内部字段保持独立，避免页面直接依赖存储结构。"""
    return {
        "id": row["id"],
        "result_id": row["result_id"],
        "device_id": row["device_id"],
        "severity": row["severity"],
        "owner_id": row["owner_id"],
        "deadline": row["deadline"],
        "rectify_status": row["rectify_status"],
        "rectify_note": row["rectify_note"],
        "rectified_at": row["rectified_at"],
        "reinspect_note": row["reinspect_note"],
        "closed_at": row["closed_at"],
        "created_at": row["created_at"],
        "escalated": row["escalated"]
    }


# 兼容旧调用方的默认 DTO 入口
def create_hazard_ticket_dto(**overrides) -> dict:
    row = create_hazard_ticket_response(
        create_hazard_ticket_row(ticket_id=1, result_id=1, device_id=1,
                                 severity="MEDIUM", owner_id=1,
                                 deadline="2026-09-22T18:00:00Z"))
    row.update(overrides)
    return row
