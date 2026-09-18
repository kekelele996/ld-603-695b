from src.seed import seed
from src.repositories.store_lock import STORE_LOCK


class InspectionResultRepository:
    def find_all(self):
        with STORE_LOCK:
            return list(seed["inspectionResult"])

    def find_by_id(self, result_id):
        with STORE_LOCK:
            return next((row for row in seed["inspectionResult"] if row["id"] == result_id), None)

    def update(self, result_id, **changes):
        with STORE_LOCK:
            row = self.find_by_id(result_id)
            if row is None:
                return None
            row.update(changes)
            return row
