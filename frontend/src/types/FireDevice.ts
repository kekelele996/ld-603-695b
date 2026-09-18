export interface FireDevice {
  id: number;
  building_id: number;
  device_code: string;
  device_type: string;
  floor: string;
  location_desc: string;
  install_date: string;
  status: string; // DeviceStatus: AVAILABLE / UNAVAILABLE
  next_maintenance_at: string;
}
