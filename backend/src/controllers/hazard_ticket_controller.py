from src.exceptions import ServiceException
from src.services.hazard_ticket_service import HazardTicketService
from src.types.hazard_ticket_payload import HazardTicketPayload
from src.types.review_payload import ReviewPayload

service = HazardTicketService()


def list_hazard_ticket(status: str = ""):
    return service.list(status)


def submit_rectify(ticket_id: int, payload: HazardTicketPayload, user: dict):
    try:
        return service.submit_rectify(ticket_id, payload, user)
    except ServiceException:
        raise
    except Exception as exc:  # pragma: no cover - 兜底包装
        raise ServiceException("VALIDATION_FAILED", f"整改提交失败: {exc}") from exc


def review_hazard_ticket(ticket_id: int, payload: ReviewPayload, user: dict):
    try:
        return service.review(ticket_id, payload, user)
    except ServiceException:
        raise
    except Exception as exc:  # pragma: no cover - 兜底包装
        raise ServiceException("VALIDATION_FAILED", f"复验失败: {exc}") from exc
