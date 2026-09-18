from fastapi import APIRouter

from src.controllers.user_controller import list_audit_log, list_user

router = APIRouter(prefix="/api", tags=["System"])

router.get("/user")(list_user)
router.get("/audit-log")(list_audit_log)
