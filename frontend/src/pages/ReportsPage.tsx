import { useEffect, useMemo } from "react";

import { EmptyState } from "../components/common/EmptyState";
import { StatCard } from "../components/common/StatCard";
import { TimelineList, type TimelineEntry } from "../components/common/TimelineList";
import { useAuditLogStore } from "../stores/AuditLogStore";
import { useFireDeviceStore } from "../stores/FireDeviceStore";
import { useHazardTicketStore } from "../stores/HazardTicketStore";
import { useInspectionResultStore } from "../stores/InspectionResultStore";
import { useInspectionTaskStore } from "../stores/InspectionTaskStore";
import { formatDate } from "../utils/formatters";

const ACTION_TONE: Record<string, "ok" | "danger" | "warn" | "info"> = {
  "HazardTicket.create": "warn",
  "HazardTicket.escalate": "danger",
  "HazardTicket.rectify": "info",
  "HazardTicket.review": "info",
  "HazardTicket.close": "ok",
  "FireDevice.status": "info",
  "InspectionResult.submit": "info",
  "InspectionResult.abnormal": "warn"
};

export function ReportsPage() {
  const taskStore = useInspectionTaskStore();
  const resultStore = useInspectionResultStore();
  const hazardStore = useHazardTicketStore();
  const deviceStore = useFireDeviceStore();
  const auditStore = useAuditLogStore();

  useEffect(() => {
    void taskStore.load();
    void resultStore.load();
    void hazardStore.load();
    void deviceStore.load();
    void auditStore.load();
  }, []);

  const abnormalCount = resultStore.rows.filter((row) => row.result_status === "ABNORMAL").length;
  const closedCount = hazardStore.rows.filter((row) => row.rectify_status === "CLOSED").length;
  const rectifyRate = hazardStore.rows.length
    ? Math.round((closedCount / hazardStore.rows.length) * 100)
    : 0;
  const faultRate = deviceStore.rows.length
    ? Math.round(
        (deviceStore.rows.filter((row) => row.status === "UNAVAILABLE").length / deviceStore.rows.length) * 100
      )
    : 0;

  const timeline: TimelineEntry[] = useMemo(
    () =>
      [...auditStore.rows]
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .slice(0, 12)
        .map((log) => ({
          key: String(log.id),
          title: `${log.action} · ${log.target_type}#${log.target_id}`,
          detail: `${log.detail}（操作人 #${log.actor_id}）`,
          time: log.created_at,
          tone: ACTION_TONE[log.action] ?? "muted"
        })),
    [auditStore.rows]
  );

  return (
    <section className="page-container">
      <header className="content-head">
        <div>
          <p className="eyebrow">fire-inspect / reports</p>
          <h1>合规报表与操作日志</h1>
          <p className="subtitle">本月巡检率、整改率、设备故障率，以及巡检提交/派单/复验关闭的审计台账</p>
        </div>
      </header>

      <section className="metrics metrics-4">
        <StatCard label="巡检任务数" value={taskStore.rows.length} />
        <StatCard label="异常结果数" value={abnormalCount} />
        <StatCard label="隐患整改关闭率" value={`${rectifyRate}%`} />
        <StatCard label="设备故障率" value={`${faultRate}%`} />
      </section>

      <section className="panel">
        <h2>最近操作日志</h2>
        {timeline.length === 0 ? (
          <EmptyState title="暂无写操作日志，完成一次异常提交/整改/复验后即可看到台账" />
        ) : (
          <TimelineList entries={timeline} />
        )}
        <p className="form-hint">台账时间：{formatDate(new Date().toISOString())}（共 {auditStore.rows.length} 条日志）</p>
      </section>
    </section>
  );
}
