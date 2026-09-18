import { useMemo } from "react";
import { StatCard } from "../components/common/StatCard";
import { EmptyState } from "../components/common/EmptyState";
import { useDataStore } from "../stores/DataStore";
import { RectifyStatusText } from "../constants/RectifyStatus";

export function ReportsPage() {
  const { hazards, results, tasks, buildings } = useDataStore();

  const byBuilding = useMemo(() => {
    return buildings.map((building) => {
      const taskIds = new Set(tasks.filter((t) => t.building_id === building.id).map((t) => t.id));
      const resultIds = new Set(results.filter((r) => taskIds.has(r.task_id)).map((r) => r.id));
      const buildingHazards = hazards.filter((h) => resultIds.has(h.result_id));
      const closed = buildingHazards.filter((h) => h.rectify_status === "CLOSED").length;
      const rectifyRate = buildingHazards.length ? Math.round((closed / buildingHazards.length) * 100) : 100;
      const abnormal = results.filter((r) => taskIds.has(r.task_id) && r.result_status === "ABNORMAL").length;
      const total = results.filter((r) => taskIds.has(r.task_id)).length;
      const faultRate = total ? Math.round((abnormal / total) * 100) : 0;
      return { building, total: buildingHazards.length, closed, rectifyRate, faultRate };
    });
  }, [buildings, hazards, results, tasks]);

  const overall = useMemo(() => {
    const closed = hazards.filter((h) => h.rectify_status === "CLOSED").length;
    const rate = hazards.length ? Math.round((closed / hazards.length) * 100) : 100;
    const statusRows = (Object.keys(RectifyStatusText) as Array<keyof typeof RectifyStatusText>).map((key) => ({
      key,
      label: RectifyStatusText[key],
      count: hazards.filter((h) => h.rectify_status === key).length
    }));
    return { rate, closed, total: hazards.length, statusRows };
  }, [hazards]);

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">fire-inspect / report</p>
          <h1>合规报表</h1>
        </div>
      </section>

      <section className="metrics">
        <StatCard label="隐患总数" value={overall.total} />
        <StatCard label="已闭环" value={overall.closed} tone="ok" />
        <StatCard label="整改闭环率" value={`${overall.rate}%`} tone="ok" />
      </section>

      <section className="workbench reports-layout">
        <div className="panel wide">
          <h2>楼栋整改率 / 故障率</h2>
          {byBuilding.length === 0 ? <EmptyState title="暂无报表数据" /> : (
            <div className="table">
              <div className="row table-head"><span>楼栋</span><span>隐患数</span><span>闭环率</span><span>设备故障率</span></div>
              {byBuilding.map((row) => (
                <article key={row.building.id} className="row">
                  <strong>{row.building.name}</strong>
                  <span>{row.total}</span>
                  <span className={row.rectifyRate === 100 ? "text-ok" : "text-danger"}>{row.rectifyRate}%</span>
                  <span className={row.faultRate > 0 ? "text-warn" : "text-ok"}>{row.faultRate}%</span>
                </article>
              ))}
            </div>
          )}
        </div>
        <div className="panel">
          <h2>隐患状态分布</h2>
          <ul className="rule-list">
            {overall.statusRows.map((row) => (
              <li key={row.key}><span>{row.label}</span><strong>{row.count}</strong></li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
