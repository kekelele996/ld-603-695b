from fastapi import Request

from src.services.hazard_ticket_service import HazardTicketService
from src.types.hazard_ticket_payload import (
    HazardCreatePayload,
    HazardRectifyPayload,
    HazardReinspectPayload,
)
from src.utils.idempotency import lookup, remember

service = HazardTicketService()


def _user_id(request: Request) -> int | None:
    raw = request.headers.get("x-user-id")
    return int(raw) if raw and raw.isdigit() else None


def list_hazard_ticket():
    # 读路径触发逾期自动升级
    return service.list()


def get_hazard_ticket(ticket_id: int):
    return service.detail(ticket_id)


def create_hazard_ticket(payload: HazardCreatePayload, request: Request):
    body = payload.model_dump()
    key = request.headers.get("idempotency-key")
    _, cached = lookup(key, body)
    if cached is not None:
        return cached
    response = service.create_from_result(
        result_id=body["result_id"],
        severity=body["severity"],
        owner_id=body["owner_id"],
        deadline=body["deadline"],
        user_id=_user_id(request),
    )
    return remember(key, body, response)


def submit_rectification(ticket_id: int, payload: HazardRectifyPayload, request: Request):
    body = payload.model_dump()
    key = request.headers.get("idempotency-key")
    _, cached = lookup(key, body)
    if cached is not None:
        return cached
    response = service.submit_rectification(
        ticket_id, body["rectify_note"], _user_id(request))
    return remember(key, body, response)


def reinspect_hazard_ticket(ticket_id: int, payload: HazardReinspectPayload, request: Request):
    body = payload.model_dump()
    key = request.headers.get("idempotency-key")
    _, cached = lookup(key, body)
    if cached is not None:
        return cached
    response = service.reinspect(
        ticket_id, body["passed"], body.get("reinspect_note", ""), _user_id(request))
    return remember(key, body, response)
