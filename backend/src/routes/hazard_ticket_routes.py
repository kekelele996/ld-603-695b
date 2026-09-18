from fastapi import APIRouter

from src.controllers.hazard_ticket_controller import (
    create_hazard_ticket,
    get_hazard_ticket,
    list_hazard_ticket,
    reinspect_hazard_ticket,
    submit_rectification,
)
from src.middlewares.rbac_middleware import allow_roles
from src.types.hazard_ticket_payload import (
    HazardCreatePayload,
    HazardRectifyPayload,
    HazardReinspectPayload,
)

router = APIRouter(prefix="/api/hazard-ticket", tags=["HazardTicket"])

router.get("")(list_hazard_ticket)
router.get("/{ticket_id}")(get_hazard_ticket)
router.post("", dependencies=[allow_roles("INSPECTOR", "SUPERVISOR")])(create_hazard_ticket)
router.post("/{ticket_id}/rectify",
            dependencies=[allow_roles("MAINTAINER", "SUPERVISOR")])(submit_rectification)
router.post("/{ticket_id}/reinspect",
            dependencies=[allow_roles("INSPECTOR", "SUPERVISOR")])(reinspect_hazard_ticket)
