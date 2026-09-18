import { useState } from "react";

import { HazardSeverity } from "../../constants/HazardSeverity";
import { HazardSeverityText } from "../../constants/HazardSeverity";
import type { InspectionResult } from "../../types/InspectionResult";
import { formatResultStatus } from "../../utils/formatters";
import { StatusBadge } from "./StatusBadge";

type Props = {
  result: InspectionResult;
  busy: boolean;
  onSubmit: (decision: "NORMAL" | "ABNORMAL", form: { severity: string; deadline: string; note: string }) => Promise<void> | void;
};

/** 巡检检查项面板：录入判定并提交；异常时必须选择隐患等级与整改期限 */
export function ChecklistPanel({ result, busy, onSubmit }: Props) {
  const [decision, setDecision] = useState<"NORMAL" | "ABNORMAL">("ABNORMAL");
  const [severity, setSeverity] = useState<string>("MEDIUM");
  const [deadline, setDeadline] = useState<string>("");
  const [note, setNote] = useState<string>(result.note ?? "");
  const submitted = !!result.submitted;

  return (
    <article className="checklist-card">
      <header className="checklist-head">
        <div>
          <strong>{result.item_code}</strong>
          <span className="checklist-measure">{result.measured_value || "未填写测量值"}</span>
        </div>
        {submitted ? (
          <StatusBadge
            value={result.result_status}
            label={formatResultStatus(result.result_status)}
          />
        ) : (
          <StatusBadge value="PLANNED" label="待判定" />
        )}
      </header>
      <p className="checklist-note">{result.note || "无备注"}</p>

      {!submitted && (
        <div className="checklist-form">
          <div className="form-row">
            <label>判定结果</label>
            <div className="segmented">
              <button
                type="button"
                className={decision === "ABNORMAL" ? "active" : ""}
                onClick={() => setDecision("ABNORMAL")}
                disabled={busy}
              >
                异常
              </button>
              <button
                type="button"
                className={decision === "NORMAL" ? "active" : ""}
                onClick={() => setDecision("NORMAL")}
                disabled={busy}
              >
                正常
              </button>
            </div>
          </div>

          {decision === "ABNORMAL" && (
            <>
              <div className="form-row">
                <label htmlFor={`severity-${result.id}`}>隐患等级</label>
                <select
                  id={`severity-${result.id}`}
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value)}
                  disabled={busy}
                >
                  {HazardSeverity.map((value) => (
                    <option key={value} value={value}>
                      {HazardSeverityText[value]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor={`deadline-${result.id}`}>整改期限</label>
                <input
                  id={`deadline-${result.id}`}
                  type="datetime-local"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                  disabled={busy}
                />
              </div>
            </>
          )}

          <div className="form-row">
            <label htmlFor={`note-${result.id}`}>提交备注</label>
            <textarea
              id={`note-${result.id}`}
              value={note}
              placeholder="补充判定说明（可选）"
              onChange={(event) => setNote(event.target.value)}
              disabled={busy}
            />
          </div>

          <button
            type="button"
            className="primary-btn"
            disabled={busy || (decision === "ABNORMAL" && !deadline)}
            onClick={() =>
              onSubmit(decision, {
                severity,
                deadline: deadline ? new Date(deadline).toISOString() : "",
                note
              })
            }
          >
            {busy ? "提交中…" : decision === "ABNORMAL" ? "提交异常并生成隐患单" : "提交正常结果"}
          </button>
          {decision === "ABNORMAL" && !deadline && (
            <p className="form-hint">异常提交必须选择整改期限</p>
          )}
        </div>
      )}
    </article>
  );
}
