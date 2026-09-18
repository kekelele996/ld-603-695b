import { useMemo, useState } from "react";
import { DeviceLocationCell } from "../components/common/DeviceLocationCell";
import { EmptyState } from "../components/common/EmptyState";
import { StatusBadge } from "../components/common/StatusBadge";
import { DeviceStatusText } from "../constants/DeviceStatus";
import { useDataStore } from "../stores/DataStore";
import { formatDate, formatDeviceType } from "../utils/formatters";

const FLOOR_FILTERS = ["ALL", "1F", "2F", "3F", "4F", "B1"] as const;

export function DevicesPage() {
  const { devices, buildings, hazards } = useDataStore();
  const [floor, setFloor] = useState<string>("ALL");
  const [onlyUnavailable, setOnlyUnavailable] = useState(false);

  // 设备当前被哪张有效隐患单占用
  const activeHazardByDevice = useMemo(() => {
    const map = new Map<number, number>();
    for (const ticket of hazards) {
      if (ticket.rectify_status !== "CLOSED") map.set(ticket.device_id, ticket.id);
    }
    return map;
  }, [hazards]);

  const visible = devices.filter(
    (device) =>
      (floor === "ALL" || device.floor === floor) &&
      (!onlyUnavailable || device.status === "UNAVAILABLE")
  );

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">fire-inspect / device</p>
          <h1>消防设备台账</h1>
          <p className="lede">隐患在管期间设备停用，复验关闭后自动恢复可用，台账状态与隐患闭环实时联动。</p>
        </div>
      </section>

      <div className="filter-bar">
        {FLOOR_FILTERS.map((value) => (
          <button key={value} className={`chip ${floor === value ? "active" : ""}`} onClick={() => setFloor(value)}>
            {value === "ALL" ? "全部楼层" : value}
          </button>
        ))}
        <button className={`chip ${onlyUnavailable ? "active danger" : ""}`} onClick={() => setOnlyUnavailable((v) => !v)}>
          只看停用
        </button>
      </div>

      {visible.length === 0 ? <EmptyState title="没有符合筛选条件的设备" /> : (
        <section className="panel">
          <div className="table device-table">
            <div className="row table-head">
              <span>设备</span><span>楼栋</span><span>类型</span>
              <span>下次维保</span><span>关联隐患</span><span>状态</span>
            </div>
            {visible.map((device) => (
              <article key={device.id} className="row device-row">
                <DeviceLocationCell device={device} />
                <span>{buildings.find((b) => b.id === device.building_id)?.name ?? "—"}</span>
                <span>{formatDeviceType(device.device_type)}</span>
                <time>{formatDate(device.next_maintenance_at)}</time>
                <span>{activeHazardByDevice.get(device.id) ? `HZ-${activeHazardByDevice.get(device.id)}` : "—"}</span>
                <StatusBadge value={device.status} label={DeviceStatusText[device.status as keyof typeof DeviceStatusText]} />
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
