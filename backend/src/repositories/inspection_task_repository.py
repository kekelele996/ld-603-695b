from src.repositories.store import store


class InspectionTaskRepository:
    def find_all(self) -> list[dict]:
        return store.table("inspectionTask")

    def find_by_id(self, task_id: int) -> dict | None:
        return store.find("inspectionTask", task_id)

    def update(self, row: dict, **changes) -> dict:
        row.update(changes)
        return row
