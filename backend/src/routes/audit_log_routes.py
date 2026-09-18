from fastapi import APIRouter, Depends

from src.controllers.audit_log_controller import list_audit_log
from src.middlewares.rbac_middleware import allow_roles

router = APIRouter(prefix="/api/audit-log", tags=["AuditLog"])


@router.get("")
def get_audit_logs(user: dict = Depends(allow_roles("INSPECTOR", "MAINTAINER", "SUPERVISOR", "AUDITOR"))):
    return list_audit_log()
