import { useCallback, useMemo } from "react";

import { ACTIVE_RECTIFY_STATUSES } from "../constants/RectifyStatus";
import type { CurrentUser } from "../types/CurrentUser";
import type { HazardTicket } from "../types/HazardTicket";

/** 判断 ISO 期限是否已逾期（CLOSED 单不参与） */
export function isOverdue(ticket: HazardTicket, now: number = Date.now()): boolean {
  if (ticket.rectify_status === "CLOSED" || !ticket.deadline) return false;
  const deadline = new Date(ticket.deadline).getTime();
  return Number.isFinite(deadline) && deadline < now;
}

export function useHazardFlow(ticket: HazardTicket | null, currentUser: CurrentUser | null) {
  const isOriginalInspector = useMemo(() => {
    if (!ticket || !currentUser) return false;
    return Number(ticket.inspector_id) === Number(currentUser.id);
  }, [ticket, currentUser]);

  const isActive = useMemo(
    () => !!ticket && (ACTIVE_RECTIFY_STATUSES as readonly string[]).includes(ticket.rectify_status),
    [ticket]
  );

  const overdue = useMemo(() => (ticket ? isOverdue(ticket) : false), [ticket]);

  // 整改按钮：维保商只能对待整改 / 驳回的单据提交
  const canRectify = useMemo(() => {
    if (!ticket || !currentUser) return false;
    if (currentUser.role !== "MAINTAINER" && currentUser.role !== "SUPERVISOR") return false;
    return ticket.rectify_status === "PENDING" || ticket.rectify_status === "REJECTED";
  }, [ticket, currentUser]);

  // 复验按钮：必须是原巡检员（主管也不行），且单据处于待复验
  const canReview = useMemo(() => {
    if (!ticket || !currentUser) return false;
    if (ticket.rectify_status !== "SUBMITTED") return false;
    return isOriginalInspector;
  }, [ticket, currentUser, isOriginalInspector]);

  const flowText = useMemo(() => {
    if (!ticket) return "";
    switch (ticket.rectify_status) {
      case "PENDING":
        return overdue ? "已逾期 · 等级自动升为严重，等待维保商整改" : "等待维保商整改";
      case "SUBMITTED":
        return isOriginalInspector
          ? "整改已提交，等待你复验"
          : "整改已提交，仅原巡检员可复验";
      case "REJECTED":
        return "复验不通过，已退回维保商重新整改";
      case "CLOSED":
        return "复验通过，隐患闭环关闭，设备已恢复可用";
      default:
        return ticket.rectify_status;
    }
  }, [ticket, overdue, isOriginalInspector]);

  // 防止重复提交：调用方在请求进行中禁用按钮
  const guardOnce = useCallback((acting: boolean) => {
    if (acting) return { disabled: true as const, reason: "处理中，请勿重复提交" };
    return { disabled: false as const, reason: "" };
  }, []);

  return { isActive, overdue, isOriginalInspector, canRectify, canReview, flowText, guardOnce };
}
