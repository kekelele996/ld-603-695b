from src.repositories.user_repository import AuditLogRepository, UserRepository

user_service_repo = UserRepository()
audit_repo = AuditLogRepository()


def list_user():
    return user_service_repo.find_all()


def list_audit_log():
    return audit_repo.find_all()
