"""巡检结果构造器：统一新建结果对象与响应 DTO。"""
from src.constructors.hazard_ticket_factory import now_iso


def create_inspection_result_row(*, result_id: int, task_id: int, device_id: int,
                                 item_code: str, result_status: str,
                                 measured_value: str, photo_url: str, note: str) -> dict:
    return {
        "id": result_id,
        "task_id": task_id,
        "device_id": device_id,
        "item_code": item_code,
        "result_status": result_status,
        "measured_value": measured_value,
        "photo_url": photo_url,
        "note": note,
        "created_at": now_iso()
    }


def create_inspection_result_response(row: dict) -> dict:
    return {
        "id": row["id"],
        "task_id": row["task_id"],
        "device_id": row["device_id"],
        "item_code": row["item_code"],
        "result_status": row["result_status"],
        "measured_value": row["measured_value"],
        "photo_url": row["photo_url"],
        "note": row["note"],
        "created_at": row["created_at"]
    }


# 兼容旧调用方的默认 DTO 入口
def create_inspection_result_dto(**overrides) -> dict:
    row = create_inspection_result_response(
        create_inspection_result_row(result_id=1, task_id=1, device_id=1,
                                     item_code="item code 1", result_status="NORMAL",
                                     measured_value="measured value 1",
                                     photo_url="/mock/photo_url-1.png", note="note 1"))
    row.update(overrides)
    return row
