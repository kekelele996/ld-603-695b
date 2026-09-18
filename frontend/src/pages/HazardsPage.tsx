import { useMemo, useState } from "react";
import { HazardCard } from "../components/hazard/HazardCard";
import { HazardFilterBar, type HazardFilter } from "../components/hazard/HazardFilterBar";
import { EmptyState } from "../components/common/EmptyState";
import { StatusBadge } from "../components/common/StatusBadge";
import { useAuthStore } from "../stores/AuthStore";
import { useDataStore } from "../stores/DataStore";
import { deriveHazardActions, useHazardFlow } from "../hooks/useHazardFlow";

export function HazardsPage() {
  const { hazards, devices, tasks, results, users } = useDataStore();
  const current = useAuthStore((state) => state.current);
  const { busyId, feedback, rectify, reinspect } = useHazardFlow();
  const [filter, setFilter] = useState<HazardFilter>("ALL");

  const counts = useMemo(() => {
    const summary: Record<string, number> = { ALL: hazards.length };
    for (const ticket of hazards) summary[ticket.rectify_status] = (summary[ticket.rectify_status] ?? 0) + 1;
    return summary;
  }, [hazards]);

  const visible = useMemo(
    () => hazards
      .filter((ticket) => filter === "ALL" || ticket.rectify_status === filter)
      .sort((a, b) => Number(a.closed_at === "") - Number(b.closed_at === "") || b.id - a.id),
    [hazards, filter]
  );

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">fire-inspect / hazard</p>
          <h1>隐患整改</h1>
          <p className="lede">异常巡检结果自动派单，逾期自动升为严重；整改提交后仅原巡检员可复验，通过才关闭并恢复设备可用。</p>
        </div>
        <div className="head-status">
          <span>当前身份：<strong>{current.name}</strong></span>
          <StatusBadge value={current.role} label={roleText(current.role)} />
        </div>
      </section>

      <HazardFilterBar value={filter} onChange={setFilter} counts={counts} />

      {visible.length === 0 ? (
        <EmptyState title="暂无该状态的隐患单" hint="在巡检任务页提交异常结果后将自动生成" />
      ) : (
        <section className="hazard-grid">
          {visible.map((ticket) => {
            const actions = deriveHazardActions(ticket, tasks, results, current);
            const result = results.find((row) => row.id === ticket.result_id);
            const task = result ? tasks.find((row) => row.id === result.task_id) : undefined;
            const inspector = users.find((user) => user.id === task?.inspector_id);
            return (
              <HazardCard
                key={ticket.id}
                ticket={ticket}
                device={devices.find((device) => device.id === ticket.device_id)}
                owner={users.find((user) => user.id === ticket.owner_id)}
                inspectorName={inspector?.name ?? `巡检员${task?.inspector_id ?? ""}`}
                resultNote={result?.note ?? ""}
                role={current.role}
                actions={actions}
                busy={busyId === ticket.id}
                feedback={feedback?.ticketId === ticket.id
                  ? { ok: feedback.ok, text: feedback.text }
                  : null}
                onRectify={(note) => rectify(ticket, note)}
                onReinspect={(passed, note) => reinspect(ticket, passed, note)}
              />
            );
          })}
        </section>
      )}
    </main>
  );
}

function roleText(role: string): string {
  return { INSPECTOR: "巡检员", MAINTAINER: "维保商", SUPERVISOR: "物业主管", AUDITOR: "审计员" }[role] ?? role;
}
