import { formatDate } from "../../utils/formatters";

export type TimelineEntry = {
  key: string;
  title: string;
  time?: string;
  detail?: string;
  tone?: "ok" | "danger" | "warn" | "info" | "muted";
};

/** 通用时间轴：隐患闭环轨迹与任务检查项共用 */
export function TimelineList({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <div className="timeline-empty">暂无流转记录</div>;
  }
  return (
    <ol className="timeline">
      {entries.map((entry) => (
        <li key={entry.key} className={`timeline-item tone-${entry.tone ?? "muted"}`}>
          <span className="timeline-dot" />
          <div>
            <p className="timeline-title">{entry.title}</p>
            {entry.detail ? <p className="timeline-detail">{entry.detail}</p> : null}
            {entry.time ? <time className="timeline-time">{formatDate(entry.time)}</time> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
