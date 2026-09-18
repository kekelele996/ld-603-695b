from src.seed import seed
from src.repositories.store_lock import STORE_LOCK


class HazardTicketRepository:
    def find_all(self):
        with STORE_LOCK:
            return list(seed["hazardTicket"])

    def find_by_id(self, ticket_id):
        with STORE_LOCK:
            return next((row for row in seed["hazardTicket"] if row["id"] == ticket_id), None)

    def find_by_result_id(self, result_id):
        with STORE_LOCK:
            return next((row for row in seed["hazardTicket"] if row["result_id"] == result_id), None)

    def add(self, row):
        with STORE_LOCK:
            row["id"] = max((item["id"] for item in seed["hazardTicket"]), default=0) + 1
            seed["hazardTicket"].append(row)
            return row

    def update(self, ticket_id, **changes):
        with STORE_LOCK:
            row = self.find_by_id(ticket_id)
            if row is None:
                return None
            row.update(changes)
            return row

    def escalate_overdue(self, now_iso):
        """逾期自动升为严重：返回被升级的隐患单列表（供日志台账记录）。"""
        from src.constants.rectify_status import ACTIVE_STATUSES, OVERDUE_SEVERITY
        escalated = []
        with STORE_LOCK:
            for row in seed["hazardTicket"]:
                if (
                    row["rectify_status"] in ACTIVE_STATUSES
                    and row["rectify_status"] != "CLOSED"
                    and row["deadline"]
                    and row["deadline"] < now_iso
                    and row["severity"] != OVERDUE_SEVERITY
                ):
                    row["severity"] = OVERDUE_SEVERITY
                    escalated.append(dict(row))
        return escalated
