import { useMemo } from "react";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { HazardSeverityTag } from "../components/common/HazardSeverityTag";
import { EmptyState } from "../components/common/EmptyState";
import { useDataStore } from "../stores/DataStore";
import { formatDate, isOverdue } from "../utils/formatters";

export function DashboardPage() {
  const { devices, hazards, tasks, results } = useDataStore();

  const stats = useMemo(() => {
    const active = hazards.filter((h) => h.rectify_status !== "CLOSED");
    const overdue = active.filter((h) => isOverdue(h.deadline));
    const critical = active.filter((h) => h.severity === "CRITICAL");
    const unavailable = devices.filter((d) => d.status === "UNAVAILABLE");
    const reviewed = tasks.filter((t) => t.status === "REVIEWED").length;
    const completion = tasks.length ? Math.round(((reviewed / tasks.length) * 100)) : 0;
    const abnormal = results.filter((r) => r.result_status === "ABNORMAL").length;
    return { active, overdue, critical, unavailable, completion, abnormal };
  }, [hazards, devices, tasks, results]);

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">fire-inspect</p>
          <h1>消防合规总览</h1>
        </div>
        <StatusBadge value="LOCAL_DATA" label="本地数据库" />
      </section>

      <section className="metrics">
        <StatCard label="有效隐患" value={stats.active.length} tone="warn" />
        <StatCard label="逾期（自动严重）" value={stats.overdue.length} tone="danger" />
        <StatCard label="严重隐患" value={stats.critical.length} tone="danger" />
        <StatCard label="停用设备" value={stats.unavailable.length} tone="warn" />
        <StatCard label="异常结果" value={stats.abnormal} tone="info" />
        <StatCard label="巡检完成率" value={`${stats.completion}%`} tone="ok" />
      </section>

      <section className="workbench">
        <div className="panel wide">
          <h2>高危 / 逾期隐患</h2>
          {stats.active.length === 0 ? <EmptyState title="当前无在管隐患" /> : (
            <div className="table">
              {[...stats.active]
                .sort((a, b) => Number(isOverdue(b.deadline)) - Number(isOverdue(a.deadline)) || b.id - a.id)
                .slice(0, 6)
                .map((ticket) => (
                  <article key={ticket.id} className="row">
                    <strong>HZ-{ticket.id}</strong>
                    <HazardSeverityTag value={ticket.severity} escalated={ticket.escalated} />
                    <span className={isOverdue(ticket.deadline) ? "text-danger" : ""}>
                      期限 {formatDate(ticket.deadline)}
                    </span>
                    <StatusBadge value={ticket.rectify_status} />
                  </article>
                ))}
            </div>
          )}
        </div>
        <div className="panel">
          <h2>闭环规则</h2>
          <ul className="rule-list">
            <li>异常结果提交即派单，设备同步停用</li>
            <li>超过整改期限自动升级为严重</li>
            <li>整改提交后仅原巡检员可复验</li>
            <li>复验通过才关闭并恢复设备可用</li>
            <li>重复提交、并发复验、刷新重放均只生效一次</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
