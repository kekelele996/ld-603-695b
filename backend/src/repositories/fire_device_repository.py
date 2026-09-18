from src.repositories.store import store


class FireDeviceRepository:
    def find_all(self) -> list[dict]:
        return store.table("fireDevice")

    def find_by_id(self, device_id: int) -> dict | None:
        return store.find("fireDevice", device_id)

    def update(self, row: dict, **changes) -> dict:
        row.update(changes)
        return row
