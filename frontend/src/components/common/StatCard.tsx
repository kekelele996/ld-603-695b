export function StatCard({ label, value, tone }: {
  label: string;
  value: string | number;
  tone?: "ok" | "warn" | "danger" | "info";
}) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
