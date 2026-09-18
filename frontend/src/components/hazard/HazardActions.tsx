import { useState } from "react";
import type { HazardTicket } from "../../types/HazardTicket";
import type { HazardFlowActions } from "../../hooks/useHazardFlow";

export function HazardActions({
  ticket,
  actions,
  role,
  busy,
  feedback,
  onRectify,
  onReinspect
}: {
  ticket: HazardTicket;
  actions: HazardFlowActions;
  role: string;
  busy: boolean;
  feedback: { ok: boolean; text: string } | null;
  onRectify: (note: string) => void;
  onReinspect: (passed: boolean, note: string) => void;
}) {
  const canRectifyRole = role === "MAINTAINER" || role === "SUPERVISOR";
  const canReinspectRole = role === "INSPECTOR" || role === "SUPERVISOR";
  const [rectifyOpen, setRectifyOpen] = useState(false);
  const [note, setNote] = useState(ticket.rectify_note ?? "");
  const [inspectOpen, setInspectOpen] = useState(false);
  const [inspectNote, setInspectNote] = useState("");

  return (
    <div className="hazard-actions">
      {actions.canRectify && canRectifyRole ? (
        rectifyOpen ? (
          <div className="action-form">
            <textarea
              placeholder="填写整改说明（必填），如：已更换密封件并重新试压"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
            />
            <div className="action-row">
              <button className="btn primary" disabled={busy || !note.trim()}
                      onClick={() => { onRectify(note.trim()); setRectifyOpen(false); }}>
                {busy ? "提交中…" : "提交整改"}
              </button>
              <button className="btn ghost" disabled={busy} onClick={() => setRectifyOpen(false)}>取消</button>
            </div>
          </div>
        ) : (
          <button className="btn primary" disabled={busy} onClick={() => setRectifyOpen(true)}>
            {ticket.rectify_status === "REJECTED" ? "重新提交整改" : "提交整改"}
          </button>
        )
      ) : null}
      {actions.canRectify && !canRectifyRole ? (
        <p className="hint">待维保商提交整改</p>
      ) : null}

      {actions.canReinspect ? (
        canReinspectRole && actions.isOriginalInspector ? (
          inspectOpen ? (
            <div className="action-form">
              <textarea
                placeholder="复验意见（可选）"
                value={inspectNote}
                onChange={(event) => setInspectNote(event.target.value)}
                rows={3}
              />
              <div className="action-row">
                <button className="btn success" disabled={busy}
                        onClick={() => { onReinspect(true, inspectNote.trim()); setInspectOpen(false); }}>
                  {busy ? "提交中…" : "复验通过 · 关闭隐患"}
                </button>
                <button className="btn danger" disabled={busy}
                        onClick={() => { onReinspect(false, inspectNote.trim()); setInspectOpen(false); }}>
                  复验不通过 · 退回
                </button>
                <button className="btn ghost" disabled={busy} onClick={() => setInspectOpen(false)}>取消</button>
              </div>
            </div>
          ) : (
            <button className="btn primary" disabled={busy} onClick={() => setInspectOpen(true)}>
              执行复验
            </button>
          )
        ) : (
          <p className="hint warn">整改已提交，仅原巡检员可复验</p>
        )
      ) : null}

      {actions.isClosed ? <p className="hint ok">该隐患已闭环关闭，设备恢复可用</p> : null}

      {feedback ? (
        <p className={`feedback ${feedback.ok ? "ok" : "error"}`} role="alert">{feedback.text}</p>
      ) : null}
    </div>
  );
}
