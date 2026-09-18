from src.repositories.store import store

ACTIVE_STATUSES = ("OPEN", "RECTIFIED", "REJECTED")


class HazardTicketRepository:
    def find_all(self) -> list[dict]:
        return store.table("hazardTicket")

    def find_by_id(self, ticket_id: int) -> dict | None:
        return store.find("hazardTicket", ticket_id)

    def find_by_result(self, result_id: int) -> dict | None:
        return next((row for row in self.find_all() if row["result_id"] == result_id), None)

    def find_active_by_result(self, result_id: int) -> dict | None:
        return next(
            (row for row in self.find_all()
             if row["result_id"] == result_id and row["rectify_status"] in ACTIVE_STATUSES),
            None,
        )

    def insert(self, row: dict) -> dict:
        self.find_all().append(row)
        return row

    def update(self, row: dict, **changes) -> dict:
        row.update(changes)
        return row
