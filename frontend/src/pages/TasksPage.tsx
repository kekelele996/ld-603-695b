import { useEffect, useState } from "react";

import { ChecklistPanel } from "../components/common/ChecklistPanel";
import { DeviceLocationCell } from "../components/common/DeviceLocationCell";
import { EmptyState } from "../components/common/EmptyState";
import { StatusBadge } from "../components/common/StatusBadge";
import { useBuildingStore } from "../stores/BuildingStore";
import { useFireDeviceStore } from "../stores/FireDeviceStore";
import { useInspectionResultStore } from "../stores/InspectionResultStore";
import { useInspectionTaskStore } from "../stores/InspectionTaskStore";
import { InspectionStatusText } from "../constants/InspectionStatus";
import { formatDate } from "../utils/formatters";

export function TasksPage() {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const taskStore = useInspectionTaskStore();
  const resultStore = useInspectionResultStore();
  const deviceStore = useFireDeviceStore();
  const buildingStore = useBuildingStore();

  useEffect(() => {
    void taskStore.load();
    void resultStore.load();
    void deviceStore.load();
    void buildingStore.load();
  }, []);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const handleSubmit = async (
    resultId: number,
    decision: "NORMAL" | "ABNORMAL",
    form: { severity: string; deadline: string; note: string }
  ) => {
    setError("");
    // 幂等键按“结果 + 提交意图”生成：刷新、双击、重放都只生效一次
    const idempotencyKey = `submit-result-${resultId}-${decision}`;
    try {
      const replayed = await resultStore.submit(
        {
          result_id: resultId,
          result_status: decision,
          note: form.note,
          ...(decision === "ABNORMAL"
            ? { severity: form.severity, deadline: form.deadline, owner_id: 3 }
            : {})
        },
        idempotencyKey
      );
      await deviceStore.load();
      if (replayed) {
        flash(`请求为重复重放，已返回原提交（结果 #${resultId} 未重复建单）`);
      } else if (decision === "ABNORMAL") {
        flash(`结果 #${resultId} 判定异常，隐患单已生成，设备已停用`);
      } else {
        flash(`结果 #${resultId} 判定正常，已提交`);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败");
    }
  };

  return (
    <section className="page-container">
      <header className="content-head">
        <div>
          <p className="eyebrow">fire-inspect / tasks</p>
          <h1>巡检任务与检查项</h1>
          <p className="subtitle">对检查项做正常/异常判定；异常自动生成隐患单并停用设备，同一结果只生效一次</p>
        </div>
      </header>

      {error && <div className="alert danger">{error}</div>}
      {notice && <div className="alert ok">{notice}</div>}
      {resultStore.error && <div className="alert danger">{resultStore.error}</div>}

      <div className="task-list">
        {taskStore.rows.map((task) => {
          const results = resultStore.rows.filter((row) => row.task_id === task.id);
          const building = buildingStore.rows.find((row) => row.id === task.building_id);
          return (
            <article key={task.id} className="panel task-card">
              <header className="task-head">
                <div>
                  <h3>任务 #{task.id} · {building?.name ?? `楼栋 ${task.building_id}`}</h3>
                  <p className="subtitle">
                    计划日期 {formatDate(task.plan_date)} · 检查表版本 {task.checklist_version}
                  </p>
                </div>
                <StatusBadge
                  value={task.status}
                  label={InspectionStatusText[task.status as keyof typeof InspectionStatusText] ?? task.status}
                />
              </header>

              {results.length === 0 ? (
                <EmptyState title="该任务暂无检查项" />
              ) : (
                <div className="checklist-grid">
                  {results.map((result) => {
                    const device = deviceStore.rows.find((row) => row.id === result.device_id);
                    return (
                      <div key={result.id} className="checklist-wrap">
                        {device && (
                          <DeviceLocationCell
                            device={device}
                            building={building}
                          />
                        )}
                        <ChecklistPanel
                          result={result}
                          busy={resultStore.actingId === result.id}
                          onSubmit={(decision, form) => handleSubmit(result.id, decision, form)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
