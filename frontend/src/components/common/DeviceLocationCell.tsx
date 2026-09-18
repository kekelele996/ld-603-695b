import type { Building } from "../../types/Building";
import type { FireDevice } from "../../types/FireDevice";
import { formatDeviceType } from "../../utils/formatters";
import { StatusBadge } from "./StatusBadge";

type Props = {
  device: FireDevice;
  building?: Building;
};

/** 设备位置单元格：设备编号 + 楼栋楼层位置 + 设备台账状态，设备页与隐患页共用 */
export function DeviceLocationCell({ device, building }: Props) {
  return (
    <div className="device-cell">
      <strong>{device.device_code}</strong>
      <span className="device-cell-sub">
        {building ? `${building.name} · ` : ""}
        {device.floor} · {device.location_desc}
      </span>
      <span className="device-cell-type">{formatDeviceType(device.device_type)}</span>
      <StatusBadge value={device.status} label={device.status === "AVAILABLE" ? "可用" : "停用"} />
    </div>
  );
}
