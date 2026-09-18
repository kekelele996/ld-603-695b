from fastapi import APIRouter, Depends, Header, HTTPException, Request

from src.constants.error_codes import ERROR_CODES
from src.controllers.inspection_result_controller import list_inspection_result, submit_inspection_result
from src.exceptions import ServiceException
from src.middlewares.rbac_middleware import allow_roles, current_user
from src.types.inspection_result_payload import InspectionResultPayload

router = APIRouter(prefix="/api/inspection-result", tags=["InspectionResult"])


@router.get("")
def get_inspection_results():
    return list_inspection_result()


@router.post("/submit", status_code=201)
def submit_result(
    payload: InspectionResultPayload,
    request: Request,
    idempotency_key: str = Header(default="", alias="Idempotency-Key"),
    user: dict = Depends(allow_roles("INSPECTOR", "SUPERVISOR"))
):
    # Idempotency-Key 保护刷新重放；当前用户由 auth 中间件注入、RBAC 依赖放行巡检员
    try:
        return submit_inspection_result(payload, user or current_user(request), idempotency_key.strip())
    except ServiceException as exc:
        status_code = 409 if exc.code in (
            ERROR_CODES["RESULT_ALREADY_SUBMITTED"],
            ERROR_CODES["HAZARD_ALREADY_EXISTS"],
            ERROR_CODES["HAZARD_STATUS_CONFLICT"]
        ) else 400
        raise HTTPException(status_code=status_code, detail={"code": exc.code, "message": exc.message})
