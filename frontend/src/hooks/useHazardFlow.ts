import { useCallback, useMemo, useRef, useState } from "react";
import type { ApiError } from "../api/client";
import { idempotencyKey } from "../api/client";
import { errorText } from "../constants/errorMessages";
import { useDataStore } from "../stores/DataStore";
import { useHazardTicketStore } from "../stores/HazardTicketStore";
import type { HazardTicket } from "../types/HazardTicket";
import type { InspectionResult } from "../types/InspectionResult";
import type { InspectionTask } from "../types/InspectionTask";
import type { User } from "../types/User";
import { isOverdue } from "../utils/formatters";

export type HazardFlowActions = {
  canRectify: boolean;          // 待整改（含驳回返工）
  canReinspect: boolean;        // 整改已提交
  isOriginalInspector: boolean; // 当前用户是原巡检员
  isClosed: boolean;
  overdue: boolean;
};

export function deriveHazardActions(
  ticket: HazardTicket,
  tasks: InspectionTask[],
  results: InspectionResult[],
  currentUser: User
): HazardFlowActions {
  const result = results.find((row) => row.id === ticket.result_id);
  const task = result ? tasks.find((row) => row.id === result.task_id) : undefined;
  const isOriginalInspector = task?.inspector_id === currentUser.id;
  return {
    canRectify: ticket.rectify_status === "OPEN" || ticket.rectify_status === "REJECTED",
    canReinspect: ticket.rectify_status === "RECTIFIED",
    isOriginalInspector,
    isClosed: ticket.rectify_status === "CLOSED",
    overdue: ticket.rectify_status !== "CLOSED" && isOverdue(ticket.deadline)
  };
}

// 每个动作生成一次幂等键：失败重试沿用同键，刷新重放也只生效一次
function useStableKey(prefix: string) {
  const ref = useRef<string>("");
  return useCallback(() => {
    if (!ref.current) ref.current = idempotencyKey(prefix);
    return ref.current;
  }, [prefix]);
}

export function useHazardFlow() {
  const refreshAll = useDataStore((state) => state.refreshAll);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ ticketId: number; ok: boolean; text: string } | null>(null);
  const rectifyKey = useStableKey("hazard-rectify");
  const passKey = useStableKey("hazard-pass");
  const rejectKey = useStableKey("hazard-reject");

  const run = useCallback(
    async (
      ticketId: number,
      action: (key: string) => Promise<void>,
      keyFactory: () => string,
      success: string
    ) => {
      setBusyId(ticketId);
      setFeedback(null);
      try {
        await action(keyFactory());
        await refreshAll(); // 隐患、设备、台账三处同步到服务端权威状态
        setFeedback({ ticketId, ok: true, text: success });
      } catch (error) {
        const apiError = error as ApiError;
        // 校验失败：后端已整体回滚，前端刷新回权威状态，保持原状
        await refreshAll();
        setFeedback({ ticketId, ok: false, text: errorText(apiError.code, apiError.message) });
      } finally {
        setBusyId(null);
      }
    },
    [refreshAll]
  );

  const rectify = useCallback(
    (ticket: HazardTicket, note: string) =>
      run(
        ticket.id,
        (key) => useHazardTicketStore.getState().rectify(ticket.id, note, key),
        rectifyKey,
        "整改已提交，等待原巡检员复验"
      ),
    [run, rectifyKey]
  );

  const reinspect = useCallback(
    (ticket: HazardTicket, passed: boolean, note: string) =>
      run(
        ticket.id,
        (key) => useHazardTicketStore.getState().reinspect(ticket.id, passed, note, key),
        passed ? passKey : rejectKey,
        passed ? "复验通过，隐患关闭，设备恢复可用" : "复验不通过，已退回整改（设备维持停用）"
      ),
    [run, passKey, rejectKey]
  );

  return useMemo(
    () => ({ busyId, feedback, setFeedback, rectify, reinspect, deriveHazardActions }),
    [busyId, feedback, rectify, reinspect]
  );
}
