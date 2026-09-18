import { useEffect, useMemo, useState } from "react";

import { useHazardFlow } from "../hooks/useHazardFlow";
import { usePagination } from "../hooks/usePagination";
import { HazardSeverity } from "../constants/HazardSeverity";
import { RectifyStatus, RectifyStatusText } from "../constants/RectifyStatus";
import { useBuildingStore } from "../stores/BuildingStore";
import { useFireDeviceStore } from "../stores/FireDeviceStore";
import { useHazardTicketStore } from "../stores/HazardTicketStore";
import { useInspectionResultStore } from "../stores/InspectionResultStore";
import { useCurrentUserStore } from "../stores/CurrentUserStore";
import { DeviceLocationCell } from "../components/common/DeviceLocationCell";
import { EmptyState } from "../components/common/EmptyState";
import { HazardSeverityTag } from "../components/common/HazardSeverityTag";
import { StatusBadge } from "../components/common/StatusBadge";
import { TimelineList, type TimelineEntry } from "../components/common/TimelineList";
import type { HazardTicket } from "../types/HazardTicket";
import { formatDate, formatRectifyStatus } from "../utils/formatters";

const FILTERS = [
  { value: "", label: "全部" },
  { value: "PENDING", label: "待整改" },
  { value: "SUBMITTED", label: "待复验" },
  { value: "REJECTED", label: "复验驳回" },
  { value: "CLOSED", label: "已关闭" }
] as const;

export function HazardsPage() {
  const [filter, setFilter] = useState<string>("");
  const [rectifyDraft, setRectifyDraft] = useState<Record<number, string>>({});
  const [reviewDraft, setReviewDraft] = useState<Record<number, string>>({});
  const [actionError, setActionError] = useState<string>("");
  const [notice, setNotice] = useState<string>("");

  const { user } = useCurrentUserStore();
  const hazardStore = useHazardTicketStore();
  const deviceStore = useFireDeviceStore();
  const buildingStore = useBuildingStore();
  const resultStore = useInspectionResultStore();
  const { pageRows, page, setPage, pageSize, total } = usePagination(hazardStore.rows);

  useEffect(() => {
    void hazardStore.load(filter);
    void deviceStore.load();
    void buildingStore.load();
    void resultStore.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const buildingById = useMemo(
    () => new Map(buildingStore.rows.map((row) => [row.id, row])),
    [buildingStore.rows]
  );
  const resultById = useMemo(
    () => new Map(resultStore.rows.map((row) => [row.id, row])),
    [resultStore.rows]
  );

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const handleRectify = async (ticket: HazardTicket) => {
    const note = (rectifyDraft[ticket.id] ?? "").trim();
    setActionError("");
    try {
      await hazardStore.rectify(ticket.id, note);
      setRectifyDraft((prev) => ({ ...prev, [ticket.id]: "" }));
      await deviceStore.load();
      flash(`隐患单 #${ticket.id} 整改已提交，等待原巡检员复验`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "整改提交失败");
    }
  };

  const handleReview = async (ticket: HazardTicket, approved: boolean) => {
    const note = (reviewDraft[ticket.id] ?? "").trim();
    setActionError("");
    try {
      await hazardStore.review(ticket.id, approved, note);
      setReviewDraft((prev) => ({ ...prev, [ticket.id]: "" }));
      await deviceStore.load();
      flash(
        approved
          ? `隐患单 #${ticket.id} 复验通过，已关闭并恢复设备可用`
          : `隐患单 #${ticket.id} 复验不通过，已退回整改`
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "复验失败");
    }
  };

  const buildTimeline = (ticket: HazardTicket): TimelineEntry[] => {
    const entries: TimelineEntry[] = [
      { key: "create", title: "异常判定，隐患单创建", time: ticket.created_at, detail: `等级：${ticket.severity}`, tone: "warn" }
    ];
    if (ticket.rectify_note) {
      entries.push({
        key: "rectify",
        title: "维保商提交整改",
        detail: ticket.rectify_note,
        tone: "info"
      });
    }
    if (ticket.rectify_status === "REJECTED") {
      entries.push({ key: "reject", title: "复验不通过，退回整改", detail: ticket.review_note, tone: "danger" });
    }
    if (ticket.rectify_status === "CLOSED") {
      entries.push({ key: "close", title: "复验通过，闭环关闭，设备恢复可用", detail: ticket.review_note, time: ticket.closed_at, tone: "ok" });
    }
    return entries;
  };

  return (
    <section className="page-container">
      <header className="content-head">
        <div>
          <p className="eyebrow">fire-inspect / hazards</p>
          <h1>隐患整改闭环</h1>
          <p className="subtitle">异常自动建单 · 逾期升级严重 · 原巡检员复验通过后设备恢复可用</p>
        </div>
        <div className="filter-tabs">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={filter === item.value ? "active" : ""}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {(actionError || hazardStore.error) && <div className="alert danger">{actionError || hazardStore.error}</div>}
      {notice && <div className="alert ok">{notice}</div>}

      {hazardStore.loading ? (
        <div className="panel">加载中…</div>
      ) : pageRows.length === 0 ? (
        <EmptyState title="当前状态下没有隐患单" />
      ) : (
        <div className="hazard-grid">
          {pageRows.map((ticket) => (
            <HazardCard
              key={ticket.id}
              ticket={ticket}
              device={deviceStore.rows.find((row) =>
                row.id === resultById.get(ticket.result_id)?.device_id
              )}
              buildingName={
                buildingById.get(
                  deviceStore.rows.find((row) => row.id === resultById.get(ticket.result_id)?.device_id)?.building_id ?? -1
                )?.name
              }
              currentUserId={user.id}
              acting={hazardStore.actingId === ticket.id}
              rectifyDraft={rectifyDraft[ticket.id] ?? ""}
              reviewDraft={reviewDraft[ticket.id] ?? ""}
              onRectifyDraft={(value) => setRectifyDraft((prev) => ({ ...prev, [ticket.id]: value }))}
              onReviewDraft={(value) => setReviewDraft((prev) => ({ ...prev, [ticket.id]: value }))}
              onRectify={() => handleRectify(ticket)}
              onReview={(approved) => handleReview(ticket, approved)}
              timeline={buildTimeline(ticket)}
            />
          ))}
        </div>
      )}

      {total > pageSize && (
        <div className="pager">
          <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>上一页</button>
          <span>{page} / {Math.max(1, Math.ceil(total / pageSize))}</span>
          <button type="button" disabled={page * pageSize >= total} onClick={() => setPage(page + 1)}>下一页</button>
        </div>
      )}
    </section>
  );
}

type CardProps = {
  ticket: HazardTicket;
  device: import("../types/FireDevice").FireDevice | undefined;
  buildingName: string | undefined;
  currentUserId: number;
  acting: boolean;
  rectifyDraft: string;
  reviewDraft: string;
  onRectifyDraft: (value: string) => void;
  onReviewDraft: (value: string) => void;
  onRectify: () => void;
  onReview: (approved: boolean) => void;
  timeline: TimelineEntry[];
};

function HazardCard(props: CardProps) {
  const { ticket, device, buildingName, currentUserId, acting } = props;
  const { user } = useCurrentUserStore();
  const flow = useHazardFlow(ticket, user);
  const isOriginalInspector = Number(ticket.inspector_id) === currentUserId;

  return (
    <article className={`panel hazard-card status-${ticket.rectify_status.toLowerCase()}`}>
      <header className="hazard-head">
        <div>
          <h3>隐患单 #{ticket.id}</h3>
          <p className="hazard-flow">{flow.flowText}</p>
        </div>
        <div className="hazard-badges">
          <HazardSeverityTag value={ticket.severity} overdue={flow.overdue} />
          <StatusBadge value={ticket.rectify_status} label={formatRectifyStatus(ticket.rectify_status)} />
        </div>
      </header>

      {device && (
        <DeviceLocationCell
          device={device}
          building={buildingName ? { id: 0, name: buildingName } as never : undefined}
        />
      )}

      <dl className="hazard-meta">
        <div><dt>整改期限</dt><dd>{formatDate(ticket.deadline)}</dd></div>
        <div><dt>责任人</dt><dd>维保商 #{ticket.owner_id}</dd></div>
        <div><dt>原巡检员</dt><dd>用户 #{ticket.inspector_id}{isOriginalInspector ? "（你）" : ""}</dd></div>
        {ticket.closed_at && <div><dt>关闭时间</dt><dd>{formatDate(ticket.closed_at)}</dd></div>}
      </dl>

      {/* 整改区：仅维保商/主管，且单据待整改或驳回 */}
      {flow.canRectify && ticket.rectify_status !== "CLOSED" && (
        <div className="action-block">
          <textarea
            placeholder="填写整改说明（必填），如：更换配件、复测结果"
            value={props.rectifyDraft}
            disabled={acting}
            onChange={(event) => props.onRectifyDraft(event.target.value)}
          />
          <button
            type="button"
            className="primary-btn"
            disabled={acting || !props.rectifyDraft.trim()}
            onClick={props.onRectify}
          >
            {acting ? "提交中…" : ticket.rectify_status === "REJECTED" ? "重新提交整改" : "提交整改"}
          </button>
        </div>
      )}

      {/* 复验区：仅原巡检员可见可用 */}
      {ticket.rectify_status === "SUBMITTED" && (
        <div className="action-block">
          {isOriginalInspector ? (
            <>
              <p className="form-hint">你是该隐患单的原巡检员，请复验后决定通过或驳回。</p>
              <textarea
                placeholder="复验意见（驳回时必填）"
                value={props.reviewDraft}
                disabled={acting}
                onChange={(event) => props.onReviewDraft(event.target.value)}
              />
              <div className="btn-row">
                <button
                  type="button"
                  className="danger-btn"
                  disabled={acting || !props.reviewDraft.trim()}
                  onClick={() => props.onReview(false)}
                >
                  复验不通过
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  disabled={acting}
                  onClick={() => props.onReview(true)}
                >
                  复验通过并关闭
                </button>
              </div>
            </>
          ) : (
            <p className="form-hint warn-text">整改已提交，复验只能由原巡检员（用户 #{ticket.inspector_id}）执行。</p>
          )}
        </div>
      )}

      <TimelineList entries={props.timeline} />
    </article>
  );
}
