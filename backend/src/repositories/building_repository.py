from src.repositories.store import store


class BuildingRepository:
    def find_all(self) -> list[dict]:
        return store.table("building")

    def find_by_id(self, building_id: int) -> dict | None:
        return store.find("building", building_id)
