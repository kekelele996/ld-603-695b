from pydantic import BaseModel


class FireDevice(BaseModel):
    id: int
    building_id: int
    device_code: str
    device_type: str
    floor: str
    location_desc: str
    install_date: str
    status: str                  # AVAILABLE / UNAVAILABLE
    next_maintenance_at: str
