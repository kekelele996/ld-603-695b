import type { FireDevice } from "../../types/FireDevice";
import { formatDeviceType } from "../../utils/formatters";

export function DeviceLocationCell({ device }: { device: FireDevice }) {
  return (
    <div className="device-location">
      <strong>{device.device_code}</strong>
      <span>{formatDeviceType(device.device_type)} · {device.floor} · {device.location_desc}</span>
    </div>
  );
}
