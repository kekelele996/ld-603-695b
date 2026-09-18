import { useEffect, useMemo, useState } from "react";

import { DeviceLocationCell } from "../components/common/DeviceLocationCell";
import { EmptyState } from "../components/common/EmptyState";
import { StatCard } from "../components/common/StatCard";
import { useBuildingStore } from "../stores/BuildingStore";
import { useFireDeviceStore } from "../stores/FireDeviceStore";
import { useHazardTicketStore } from "../stores/HazardTicketStore";
import { useInspectionResultStore } from "../stores/InspectionResultStore";
import { ACTIVE_RECTIFY_STATUSES } from "../constants/RectifyStatus";
import { formatDate, formatDeviceType } from "../utils/formatters";

const FLOOR_FILTERS = ["全部楼层", "1F", "2F", "3F", "5F"] as const;

export function DevicesPage() {
  const [floor, setFloor] = useState<string>("全部楼层");
  const deviceStore = useFireDeviceStore();
  const buildingStore = useBuildingStore();
  const hazardStore = useHazardTicketStore();
  const resultStore = useInspectionResultStore();

  useEffect(() => {
    void deviceStore.load();
    void buildingStore.load();
    void hazardStore.load();
    void resultStore.load();
  }, []);

  const buildingById = useMemo(
    () => new Map(buildingStore.rows.map((row) => [row.id, row])),
    [buildingStore.rows]
  );
  const activeTicketByDevice = useMemo(() => {
    const resultById = new Map(resultStore.rows.map((row) => [row.id, row]));
    const map = new Map<number, (typeof hazardStore.rows)[number]>();
    for (const ticket of hazardStore.rows) {
      if (!(ACTIVE_RECTIFY_STATUSES as readonly string[]).includes(ticket.rectify_status)) continue;
      const result = resultById.get(ticket.result_id);
      if (result) map.set(result.device_id, ticket);
    }
    return map;
  }, [hazardStore.rows, resultStore.rows]);

  const rows = useMemo(
    () => deviceStore.rows.filter((device) => floor === "全部楼层" || device.floor === floor),
    [deviceStore.rows, floor]
  );

  const unavailableCount = deviceStore.rows.filter((row) => row.status === "UNAVAILABLE").length;

  return (
    <section className="page-container">
      <header className="content-head">
        <div>
          <p className="eyebrow">fire-inspect / devices</p>
          <h1>消防设备台账</h1>
          <p className="subtitle">设备仅在隐患复验通过后恢复可用；停用中的设备关联一张有效隐患单</p>
        </div>
        <div className="filter-tabs">
          {FLOOR_FILTERS.map((value) => (
            <button key={value} type="button" className={floor === value ? "active" : ""} onClick={() => setFloor(value)}>
              {value}
            </button>
          ))}
        </div>
      </header>

      <section className="metrics metrics-4">
        <StatCard label="设备总数" value={deviceStore.rows.length} />
        <StatCard label="可用设备" value={deviceStore.rows.length - unavailableCount} />
        <StatCard label="停用设备（隐患未闭环）" value={unavailableCount} />
        <StatCard label="有效隐患单" value={activeTicketByDevice.size} />
      </section>

      {rows.length === 0 ? (
        <EmptyState title="该楼层暂无设备" />
      ) : (
        <div className="panel table-panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>设备 / 位置</th>
                <th>类型</th>
                <th>安装日期</th>
                <th>下次维保</th>
                <th>台账状态</th>
                <th>关联隐患</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((device) => {
                const ticket = activeTicketByDevice.get(device.id);
                return (
                  <tr key={device.id} className={device.status === "UNAVAILABLE" ? "row-danger" : ""}>
                    <td>
                      <DeviceLocationCell device={device} building={buildingById.get(device.building_id)} />
                    </td>
                    <td>{formatDeviceType(device.device_type)}</td>
                    <td>{formatDate(device.install_date)}</td>
                    <td>{formatDate(device.next_maintenance_at)}</td>
                    <td>
                      <span className={`status-dot ${device.status === "AVAILABLE" ? "ok" : "danger"}`} />
                      {device.status === "AVAILABLE" ? "可用" : "停用（隐患未闭环）"}
                    </td>
                    <td>{ticket ? `隐患单 #${ticket.id} · ${ticket.rectify_status}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
