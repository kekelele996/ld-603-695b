export type TimelineEntry = {
  key: string;
  title: string;
  time: string;
  tone?: "ok" | "warn" | "danger" | "info" | "muted";
  desc?: string;
};

export function TimelineList({ title, entries }: { title?: string; entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <div className="empty">暂无流转记录</div>;
  }
  return (
    <div className="timeline">
      {title ? <h3>{title}</h3> : null}
      <ol>
        {entries.map((entry) => (
          <li key={entry.key} className={`timeline-item ${entry.tone ?? "muted"}`}>
            <span className="timeline-dot" />
            <div>
              <p className="timeline-title">{entry.title}</p>
              {entry.desc ? <p className="timeline-desc">{entry.desc}</p> : null}
              <time>{entry.time}</time>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
