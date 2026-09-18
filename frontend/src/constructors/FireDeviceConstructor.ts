import type { FireDevice } from "../types/FireDevice";

export const createDefaultFireDevice = (overrides: Partial<FireDevice> = {}): FireDevice => ({
  id: 1,
  building_id: 1,
  device_code: "FH-101",
  device_type: "HYDRANT",
  floor: "1F",
  location_desc: "",
  install_date: "",
  status: "AVAILABLE",
  next_maintenance_at: "",
  ...overrides
});

export const createFireDeviceForm = createDefaultFireDevice;
export const createFireDeviceResponse = createDefaultFireDevice;
