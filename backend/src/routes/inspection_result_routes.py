from fastapi import APIRouter

from src.controllers.inspection_result_controller import (
    list_inspection_result,
    submit_inspection_result,
)
from src.middlewares.rbac_middleware import allow_roles

router = APIRouter(prefix="/api/inspection-result", tags=["InspectionResult"])

router.get("")(list_inspection_result)
router.post("/submit", dependencies=[allow_roles("INSPECTOR", "SUPERVISOR")])(
    submit_inspection_result
)
