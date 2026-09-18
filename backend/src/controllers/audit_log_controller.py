from src.services.audit_log_service import AuditLogService

service = AuditLogService()


def list_audit_log():
    return service.list()
