def create_inspection_result_dto(**overrides):
    """构造巡检结果响应 DTO 的默认行（保持与 seed 字段一致）。"""
    row = {
        "id": 0,
        "task_id": 0,
        "device_id": 0,
        "item_code": "",
        "result_status": "NORMAL",
        "measured_value": "",
        "photo_url": "",
        "note": "",
        "submitted": False,
        "inspector_id": None
    }
    row.update(overrides)
    return row
