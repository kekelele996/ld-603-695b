from src.repositories.store import store


class InspectionResultRepository:
    def find_all(self) -> list[dict]:
        return store.table("inspectionResult")

    def find_by_id(self, result_id: int) -> dict | None:
        return store.find("inspectionResult", result_id)

    def find_by_task_item(self, task_id: int, item_code: str) -> dict | None:
        return next(
            (row for row in self.find_all()
             if row["task_id"] == task_id and row["item_code"] == item_code),
            None,
        )

    def insert(self, row: dict) -> dict:
        self.find_all().append(row)
        return row
