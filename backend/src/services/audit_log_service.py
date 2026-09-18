from src.repositories.audit_log_repository import AuditLogRepository


class AuditLogService:
    def __init__(self):
        self.repo = AuditLogRepository()

    def list(self):
        return self.repo.find_all()
