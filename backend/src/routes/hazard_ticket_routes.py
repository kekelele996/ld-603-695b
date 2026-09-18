from fastapi import APIRouter, Depends, HTTPException

from src.constants.error_codes import ERROR_CODES
from src.controllers.hazard_ticket_controller import list_hazard_ticket, review_hazard_ticket, submit_rectify
from src.exceptions import ServiceException
from src.middlewares.rbac_middleware import allow_roles
from src.types.hazard_ticket_payload import HazardTicketPayload
from src.types.review_payload import ReviewPayload

router = APIRouter(prefix="/api/hazard-ticket", tags=["HazardTicket"])

_CONFLICT_CODES = (
    ERROR_CODES["HAZARD_ALREADY_EXISTS"],
    ERROR_CODES["HAZARD_STATUS_CONFLICT"],
    ERROR_CODES["HAZARD_CLOSED"]
)
_FORBIDDEN_CODES = (ERROR_CODES["NOT_ORIGINAL_INSPECTOR"],)


def _raise(exc: ServiceException):
    if exc.code in _FORBIDDEN_CODES:
        status_code = 403
    elif exc.code in _CONFLICT_CODES:
        status_code = 409
    else:
        status_code = 400
    raise HTTPException(status_code=status_code, detail={"code": exc.code, "message": exc.message})


@router.get("")
def get_hazard_tickets(status: str = ""):
    return list_hazard_ticket(status)


@router.post("/{ticket_id}/rectify", status_code=200)
def rectify(
    ticket_id: int,
    payload: HazardTicketPayload,
    user: dict = Depends(allow_roles("MAINTAINER", "SUPERVISOR"))
):
    try:
        return submit_rectify(ticket_id, payload, user)
    except ServiceException as exc:
        _raise(exc)


@router.post("/{ticket_id}/review", status_code=200)
def review(
    ticket_id: int,
    payload: ReviewPayload,
    user: dict = Depends(allow_roles("INSPECTOR", "SUPERVISOR"))
):
    try:
        return review_hazard_ticket(ticket_id, payload, user)
    except ServiceException as exc:
        _raise(exc)
