from src.seed import seed
from src.repositories.store_lock import STORE_LOCK


class FireDeviceRepository:
    def find_all(self):
        with STORE_LOCK:
            return list(seed["fireDevice"])

    def find_by_id(self, device_id):
        with STORE_LOCK:
            return next((row for row in seed["fireDevice"] if row["id"] == device_id), None)

    def update_status(self, device_id, status):
        with STORE_LOCK:
            row = self.find_by_id(device_id)
            if row is None:
                return None
            row["status"] = status
            return row
