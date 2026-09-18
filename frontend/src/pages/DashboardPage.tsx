import { useEffect, useMemo } from "react";

import { HazardSeverityTag } from "../components/common/HazardSeverityTag";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { isOverdue } from "../hooks/useHazardFlow";
import { useFireDeviceStore } from "../stores/FireDeviceStore";
import { useHazardTicketStore } from "../stores/HazardTicketStore";
import { useInspectionResultStore } from "../stores/InspectionResultStore";
import { ACTIVE_RECTIFY_STATUSES } from "../constants/RectifyStatus";
import { formatDate, formatRectifyStatus } from "../utils/formatters";

export function DashboardPage() {
  const deviceStore = useFireDeviceStore();
  const hazardStore = useHazardTicketStore();
  const resultStore = useInspectionResultStore();

  useEffect(() => {
    void deviceStore.load();
    void hazardStore.load();
    void resultStore.load();
  }, []);

  const activeTickets = useMemo(
    () => hazardStore.rows.filter((row) => (ACTIVE_RECTIFY_STATUSES as readonly string[]).includes(row.rectify_status)),
    [hazardStore.rows]
  );
  const overdueTickets = useMemo(() => activeTickets.filter((row) => isOverdue(row)), [activeTickets]);
  const criticalTickets = useMemo(
    () => activeTickets.filter((row) => row.severity === "CRITICAL"),
    [activeTickets]
  );
  const unavailable = deviceStore.rows.filter((row) => row.status === "UNAVAILABLE").length;
  const submittedResults = resultStore.rows.filter((row) => row.submitted).length;
  const completionRate = resultStore.rows.length
    ? Math.round((submittedResults / resultStore.rows.length) * 100)
    : 0;

  return (
    <section className="page-container">
      <header className="content-head">
        <div>
          <p className="eyebrow">fire-inspect / dashboard</p>
          <h1>消防合规总览</h1>
          <p className="subtitle">设备状态分布 · 逾期整改 · 巡检完成率 · 高危隐患</p>
        </div>
      </header>

      <section className="metrics metrics-4">
        <StatCard label="设备可用率" value={`${deviceStore.rows.length ? Math.round(((deviceStore.rows.length - unavailable) / deviceStore.rows.length) * 100) : 0}%`} />
        <StatCard label="停用设备" value={unavailable} />
        <StatCard label="逾期隐患（已自动升级严重）" value={overdueTickets.length} />
        <StatCard label="巡检完成率" value={`${completionRate}%`} />
      </section>

      <div className="dash-columns">
        <section className="panel">
          <h2>高危与逾期隐患</h2>
          {criticalTickets.length === 0 ? (
            <p className="subtitle">当前没有严重等级隐患。</p>
          ) : (
            <div className="table">
              {criticalTickets.map((ticket) => (
                <article key={ticket.id} className="row hazard-dash-row">
                  <strong>隐患单 #{ticket.id}</strong>
                  <HazardSeverityTag value={ticket.severity} overdue={isOverdue(ticket)} />
                  <StatusBadge value={ticket.rectify_status} label={formatRectifyStatus(ticket.rectify_status)} />
                  <span className="subtitle">期限 {formatDate(ticket.deadline)}</span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <h2>设备状态分布</h2>
          <div className="dist-list">
            <div className="dist-row">
              <span className="status-dot ok" />
              <strong>可用</strong>
              <em>{deviceStore.rows.length - unavailable}</em>
            </div>
            <div className="dist-row">
              <span className="status-dot danger" />
              <strong>停用（隐患未闭环）</strong>
              <em>{unavailable}</em>
            </div>
          </div>
          <h2 style={{ marginTop: 22 }}>待办闭环</h2>
          <div className="dist-list">
            <div className="dist-row"><strong>待整改</strong><em>{activeTickets.filter((t) => t.rectify_status === "PENDING").length}</em></div>
            <div className="dist-row"><strong>待复验</strong><em>{activeTickets.filter((t) => t.rectify_status === "SUBMITTED").length}</em></div>
            <div className="dist-row"><strong>复验驳回</strong><em>{activeTickets.filter((t) => t.rectify_status === "REJECTED").length}</em></div>
            <div className="dist-row"><strong>本月已关闭</strong><em>{hazardStore.rows.filter((t) => t.rectify_status === "CLOSED").length}</em></div>
          </div>
        </section>
      </div>
    </section>
  );
}
