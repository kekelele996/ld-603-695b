import type { HazardTicket } from "../../types/HazardTicket";
import { HazardSeverityTag } from "../common/HazardSeverityTag";
import { StatusBadge } from "../common/StatusBadge";
import { DeviceLocationCell } from "../common/DeviceLocationCell";
import { TimelineList, type TimelineEntry } from "../common/TimelineList";
import type { HazardFlowActions } from "../../hooks/useHazardFlow";
import { RectifyStatusText } from "../../constants/RectifyStatus";
import { formatDate } from "../../utils/formatters";
import { HazardActions } from "./HazardActions";
import type { FireDevice } from "../../types/FireDevice";
import type { User } from "../../types/User";

export function HazardCard({
  ticket,
  device,
  owner,
  inspectorName,
  resultNote,
  role,
  actions,
  busy,
  feedback,
  onRectify,
  onReinspect
}: {
  ticket: HazardTicket;
  device?: FireDevice;
  owner?: User;
  inspectorName: string;
  resultNote: string;
  role: string;
  actions: HazardFlowActions;
  busy: boolean;
  feedback: { ok: boolean; text: string } | null;
  onRectify: (note: string) => void;
  onReinspect: (passed: boolean, note: string) => void;
}) {
  const timeline: TimelineEntry[] = [
    { key: "open", title: `异常结果派单 · ${ticket.severity}`, time: formatDate(ticket.created_at), tone: "warn", desc: resultNote },
    ticket.rectified_at
      ? { key: "rectify", title: "整改提交", time: formatDate(ticket.rectified_at), tone: "info", desc: ticket.rectify_note }
      : null,
    ticket.rectify_status === "REJECTED"
      ? { key: "reject", title: "复验驳回，退回整改", time: formatDate(ticket.rectified_at), tone: "danger", desc: ticket.reinspect_note }
      : null,
    ticket.closed_at
      ? { key: "close", title: "复验通过，隐患关闭，设备恢复可用", time: formatDate(ticket.closed_at), tone: "ok", desc: ticket.reinspect_note }
      : null
  ].filter(Boolean) as TimelineEntry[];

  return (
    <article className={`hazard-card ${ticket.rectify_status.toLowerCase()} ${actions.overdue ? "is-overdue" : ""}`}>
      <header className="hazard-head">
        <div>
          <h3>隐患单 HZ-{ticket.id}</h3>
          <p className="sub">原巡检员：{inspectorName}</p>
        </div>
        <div className="hazard-tags">
          <HazardSeverityTag value={ticket.severity} escalated={ticket.escalated} />
          <StatusBadge value={ticket.rectify_status} label={RectifyStatusText[ticket.rectify_status as keyof typeof RectifyStatusText]} />
          {actions.overdue && <StatusBadge value="OVERDUE" label="已逾期" />}
        </div>
      </header>

      {device ? <DeviceLocationCell device={device} /> : null}

      <dl className="hazard-meta">
        <div><dt>整改责任人</dt><dd>{owner?.name ?? `用户${ticket.owner_id}`}</dd></div>
        <div><dt>整改期限</dt><dd className={actions.overdue ? "text-danger" : ""}>{formatDate(ticket.deadline)}</dd></div>
      </dl>

      <HazardActions
        ticket={ticket}
        actions={actions}
        role={role}
        busy={busy}
        feedback={feedback}
        onRectify={onRectify}
        onReinspect={onReinspect}
      />

      <TimelineList entries={timeline} />
    </article>
  );
}
