import { useMemo, useRef, useState } from "react";
import type { SubmitResultPayload } from "../../api/InspectionResult";
import { idempotencyKey } from "../../api/client";
import type { ApiError } from "../../api/client";
import { ChecklistPanel } from "../common/ChecklistPanel";
import { HazardSeverity, HazardSeverityText } from "../../constants/HazardSeverity";
import { InspectionResultStatusText } from "../../constants/InspectionResultStatus";
import { errorText } from "../../constants/errorMessages";
import type { FireDevice } from "../../types/FireDevice";
import type { InspectionTask } from "../../types/InspectionTask";
import type { User } from "../../types/User";

// 默认整改期限：派单后 4 天 18:00
function defaultDeadline(): string {
  const date = new Date(Date.now() + 4 * 24 * 3600 * 1000);
  date.setHours(18, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ResultSubmitForm({
  task,
  devices,
  owners,
  submittedKeys,
  onSubmitted,
  refreshAfterWrite
}: {
  task: InspectionTask;
  devices: FireDevice[];
  owners: User[];
  submittedKeys: Set<string>; // 已提交过的 task:item，重复提交按钮直接禁用
  onSubmitted: (payload: SubmitResultPayload, key: string) => Promise<unknown>;
  refreshAfterWrite: () => Promise<void>;
}) {
  const taskDevices = useMemo(
    () => devices.filter((device) => task.device_ids.includes(device.id)),
    [devices, task.device_ids]
  );
  const [deviceId, setDeviceId] = useState<number>(taskDevices[0]?.id ?? 0);
  const [itemCode, setItemCode] = useState("");
  const [resultStatus, setResultStatus] = useState<"NORMAL" | "ABNORMAL">("NORMAL");
  const [measuredValue, setMeasuredValue] = useState("");
  const [note, setNote] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [ownerId, setOwnerId] = useState<number>(owners[0]?.id ?? 0);
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 表单打开时生成一次幂等键：重试/刷新重放沿用同键
  const keyRef = useRef<string>(idempotencyKey("result-submit"));

  const dupKey = `${task.id}:${itemCode.trim()}`;
  const duplicated = submittedKeys.has(dupKey);
  const abnormalInvalid = resultStatus === "ABNORMAL" && (!ownerId || !deadline);
  const invalid = !deviceId || !itemCode.trim() || duplicated || abnormalInvalid || submitting;

  async function handleSubmit() {
    setError(null);
    setNotice(null);
    setSubmitting(true);
    const payload: SubmitResultPayload = {
      task_id: task.id,
      device_id: deviceId,
      item_code: itemCode.trim(),
      result_status: resultStatus,
      measured_value: measuredValue.trim(),
      note: note.trim(),
      ...(resultStatus === "ABNORMAL"
        ? { severity, owner_id: ownerId, deadline: new Date(deadline).toISOString() }
        : {})
    };
    try {
      const response = await onSubmitted(payload, keyRef.current);
      if (resultStatus === "ABNORMAL" && response && typeof response === "object" && "hazard_ticket" in response) {
        const hazard = (response as { hazard_ticket: { id: number } }).hazard_ticket;
        setNotice(`判定异常：隐患单 HZ-${hazard.id} 已生成，设备已停用`);
      } else {
        setNotice("巡检结果已记录为正常");
      }
      setItemCode("");
      setMeasuredValue("");
      setNote("");
      keyRef.current = idempotencyKey("result-submit");
      await refreshAfterWrite();
    } catch (apiError) {
      const err = apiError as ApiError;
      setError(errorText(err.code, err.message));
      await refreshAfterWrite(); // 失败后以服务端为准，保持原状
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ChecklistPanel title={`任务 #${task.id} 检查项录入（${task.checklist_version}）`}>
      <div className="form-grid">
        <label>
          检查设备
          <select value={deviceId} onChange={(e) => setDeviceId(Number(e.target.value))}>
            {taskDevices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.device_code} · {device.floor} · {device.location_desc}
                {device.status === "UNAVAILABLE" ? "（已停用）" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          检查项编码
          <input value={itemCode} placeholder="如 WATER_PRESSURE"
                 onChange={(e) => setItemCode(e.target.value)} />
        </label>
        <label>
          实测值
          <input value={measuredValue} placeholder="如 0.35MPa"
                 onChange={(e) => setMeasuredValue(e.target.value)} />
        </label>
        <fieldset className="result-switch">
          <legend>判定结果</legend>
          {(["NORMAL", "ABNORMAL"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`chip ${resultStatus === value ? `active ${value.toLowerCase()}` : ""}`}
              onClick={() => setResultStatus(value)}
            >
              {InspectionResultStatusText[value]}
            </button>
          ))}
        </fieldset>
        <label className="span-2">
          巡检备注
          <input value={note} placeholder="异常现象描述" onChange={(e) => setNote(e.target.value)} />
        </label>

        {resultStatus === "ABNORMAL" ? (
          <>
            <label>
              隐患分级
              <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                {HazardSeverity.map((value) => (
                  <option key={value} value={value}>{HazardSeverityText[value]}</option>
                ))}
              </select>
            </label>
            <label>
              整改责任人
              <select value={ownerId} onChange={(e) => setOwnerId(Number(e.target.value))}>
                {owners.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </label>
            <label className="span-2">
              整改期限（逾期自动升为严重）
              <input type="datetime-local" value={deadline}
                     onChange={(e) => setDeadline(e.target.value)} />
            </label>
          </>
        ) : null}
      </div>

      {duplicated ? <p className="feedback error">该检查项在本任务中已提交过，禁止重复提交</p> : null}
      {error ? <p className="feedback error" role="alert">{error}</p> : null}
      {notice ? <p className="feedback ok" role="status">{notice}</p> : null}

      <div className="checklist-footer">
        <button className="btn primary" disabled={invalid} onClick={handleSubmit}>
          {submitting ? "提交中…" : "提交巡检结果"}
        </button>
        <span className="hint">
          异常提交将在同一事务内生成隐患单并停用设备；刷新或重复点击只生效一次。
        </span>
      </div>
    </ChecklistPanel>
  );
}
