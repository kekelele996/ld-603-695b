from src.repositories.store import store


class UserRepository:
    def find_all(self) -> list[dict]:
        return store.table("user")

    def find_by_id(self, user_id: int) -> dict | None:
        return store.find("user", user_id)


class AuditLogRepository:
    def find_all(self) -> list[dict]:
        return store.table("auditLog")
