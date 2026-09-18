from fastapi import Request

from src.services.inspection_result_service import InspectionResultService
from src.types.inspection_result_payload import InspectionResultSubmitPayload
from src.utils.idempotency import lookup, remember

service = InspectionResultService()


def list_inspection_result():
    return service.list()


def submit_inspection_result(payload: InspectionResultSubmitPayload, request: Request):
    body = payload.model_dump()
    key = request.headers.get("idempotency-key")
    _, cached = lookup(key, body)
    if cached is not None:
        return cached
    raw = request.headers.get("x-user-id")
    user_id = int(raw) if raw and raw.isdigit() else None
    response = service.submit(body, user_id)
    return remember(key, body, response)
