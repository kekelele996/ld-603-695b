import type { ReactNode } from "react";

export function ChecklistPanel({ title, children, footer }: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="panel checklist-panel">
      <h2>{title}</h2>
      <div className="checklist-body">{children}</div>
      {footer ? <div className="checklist-footer">{footer}</div> : null}
    </section>
  );
}
