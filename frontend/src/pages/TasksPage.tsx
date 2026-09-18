import { useMemo, useState } from "react";
import { ResultSubmitForm } from "../components/hazard/ResultSubmitForm";
import { ChecklistPanel } from "../components/common/ChecklistPanel";
import { EmptyState } from "../components/common/EmptyState";
import { StatusBadge } from "../components/common/StatusBadge";
import { InspectionStatusText } from "../constants/InspectionStatus";
import { InspectionResultStatusText } from "../constants/InspectionResultStatus";
import { useAuthStore } from "../stores/AuthStore";
import { useDataStore } from "../stores/DataStore";
import { useInspectionResultStore } from "../stores/InspectionResultStore";
import { formatDate } from "../utils/formatters";
import type { InspectionResult } from "../types/InspectionResult";

export function TasksPage() {
  const { tasks, results, devices, buildings, users, refreshAll } = useDataStore();
  const current = useAuthStore((state) => state.current);
  const submitResult = useInspectionResultStore((state) => state.submit);
  const [activeTaskId, setActiveTaskId] = useState<number>(tasks[0]?.id ?? 0);

  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? tasks[0];
  const maintainers = users.filter((user) => user.role === "MAINTAINER" || user.role === "SUPERVISOR");

  // 已提交过的 task:item_code 集合：同一检查项只允许一次
  const submittedKeys = useMemo(
    () => new Set(results.map((row) => `${row.task_id}:${row.item_code}`)),
    [results]
  );

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">fire-inspect / task</p>
          <h1>巡检任务</h1>
          <p className="lede">选择任务录入检查项：判定为异常时立即生成隐患单并停用设备；同一检查项重复提交只生效一次。</p>
        </div>
      </section>

      <section className="workbench tasks-layout">
        <ChecklistPanel title="任务列表">
          <div className="task-list">
            {tasks.map((task) => {
              const building = buildings.find((item) => item.id === task.building_id);
              const mine = task.inspector_id === current.id;
              return (
                <button
                  key={task.id}
                  className={`task-item ${activeTask?.id === task.id ? "active" : ""}`}
                  onClick={() => setActiveTaskId(task.id)}
                >
                  <div className="task-item-head">
                    <strong>任务 #{task.id} · {task.task_type}</strong>
                    <StatusBadge value={task.status} label={InspectionStatusText[task.status as keyof typeof InspectionStatusText]} />
                  </div>
                  <span>{building?.name ?? `楼栋${task.building_id}`} · 计划 {formatDate(task.plan_date)}</span>
                  <span className={mine ? "mine" : "not-mine"}>
                    {mine ? "我的任务（可复验本任务隐患）" : `巡检员：${users.find((u) => u.id === task.inspector_id)?.name ?? task.inspector_id}`}
                  </span>
                </button>
              );
            })}
          </div>
        </ChecklistPanel>

        <div className="task-main">
          {activeTask ? (
            <>
              {(current.role === "INSPECTOR" || current.role === "SUPERVISOR") ? (
                <ResultSubmitForm
                  key={activeTask.id}
                  task={activeTask}
                  devices={devices}
                  owners={maintainers.length ? maintainers : users}
                  submittedKeys={submittedKeys}
                  onSubmitted={submitResult}
                  refreshAfterWrite={refreshAll}
                />
              ) : (
                <ChecklistPanel title={`任务 #${activeTask.id} 检查项录入（${activeTask.checklist_version}）`}>
                  <p className="hint warn">仅巡检员可录入检查项；当前身份可查看下方结果台账。</p>
                </ChecklistPanel>
              )}
              <ChecklistPanel title={`任务 #${activeTask.id} 已提交结果台账`}>
                <ResultLedger rows={results.filter((row) => row.task_id === activeTask.id)}
                              deviceName={(id) => devices.find((d) => d.id === id)?.device_code ?? `设备${id}`} />
              </ChecklistPanel>
            </>
          ) : (
            <EmptyState title="暂无巡检任务" />
          )}
        </div>
      </section>
    </main>
  );
}

function ResultLedger({ rows, deviceName }: { rows: InspectionResult[]; deviceName: (id: number) => string }) {
  if (rows.length === 0) return <EmptyState title="本任务尚未提交任何检查项" />;
  return (
    <div className="table ledger">
      {rows.map((row) => (
        <article key={row.id} className={`row ledger-row ${row.result_status.toLowerCase()}`}>
          <strong>{deviceName(row.device_id)} · {row.item_code}</strong>
          <span>{row.measured_value || "—"}</span>
          <StatusBadge value={row.result_status} label={InspectionResultStatusText[row.result_status as keyof typeof InspectionResultStatusText]} />
          <time>{formatDate(row.created_at)}</time>
        </article>
      ))}
    </div>
  );
}
