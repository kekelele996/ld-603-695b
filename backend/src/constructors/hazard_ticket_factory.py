def create_hazard_ticket_dto(**overrides):
    """构造隐患单响应 DTO 的默认行（保持与 seed 字段一致）。"""
    row = {
        "id": 0,
        "result_id": 0,
        "severity": "MEDIUM",
        "owner_id": 0,
        "deadline": "",
        "rectify_status": "PENDING",
        "rectify_note": "",
        "closed_at": "",
        "created_at": "",
        "submitted_by": None,
        "review_note": "",
        "inspector_id": None
    }
    row.update(overrides)
    return row


def build_new_hazard_ticket(result, severity, deadline, owner_id, now_iso):
    """异常巡检结果触发建单时的工厂方法：只在这里收敛新单默认结构。"""
    return create_hazard_ticket_dto(
        result_id=result["id"],
        severity=severity,
        owner_id=owner_id,
        deadline=deadline,
        rectify_status="PENDING",
        created_at=now_iso,
        inspector_id=result.get("inspector_id")
    )
