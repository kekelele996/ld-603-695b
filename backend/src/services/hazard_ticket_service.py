from src.constants.log_templates import LOG_TEMPLATES
from src.constants.rectify_status import ACTIVE_STATUSES, OVERDUE_SEVERITY
from src.exceptions import ServiceException
from src.repositories.audit_log_repository import AuditLogRepository
from src.repositories.fire_device_repository import FireDeviceRepository
from src.repositories.hazard_ticket_repository import HazardTicketRepository
from src.repositories.inspection_result_repository import InspectionResultRepository
from src.repositories.store_lock import STORE_LOCK, restore_state, snapshot_state
from src.utils.time_utils import now_iso

SYSTEM_ACTOR_ID = 0


class HazardTicketService:
    """隐患整改闭环：逾期升级 → 整改提交 → 原巡检员复验 → 关闭恢复设备。"""

    def __init__(self):
        self.repo = HazardTicketRepository()
        self.result_repo = InspectionResultRepository()
        self.device_repo = FireDeviceRepository()
        self.audit_repo = AuditLogRepository()

    def _escalate_overdue_locked(self):
        """逾期自动升为严重（由列表读取与后台巡检共同驱动，升级动作幂等）。"""
        ts = now_iso()
        escalated = self.repo.escalate_overdue(ts)
        for row in escalated:
            self.audit_repo.append(
                SYSTEM_ACTOR_ID, LOG_TEMPLATES["HazardTicket"][1],
                "HazardTicket", row["id"],
                f"超过整改期限 {row['deadline']}，等级自动升为 {OVERDUE_SEVERITY}"
            )
        return escalated

    def list(self, status: str = ""):
        with STORE_LOCK:
            self._escalate_overdue_locked()
            rows = self.repo.find_all()
        if status:
            rows = [row for row in rows if row["rectify_status"] == status]
        return rows

    def submit_rectify(self, ticket_id, payload, user):
        """维保商提交整改：仅 PENDING / REJECTED 的有效隐患单可提交，只生效一次。"""
        from src.constants.error_codes import ERROR_CODES

        note = (payload.rectify_note or "").strip()
        if not note:
            raise ServiceException(ERROR_CODES["RECTIFY_NOTE_REQUIRED"])

        ticket = self.repo.find_by_id(ticket_id)
        if ticket is None:
            raise ServiceException(ERROR_CODES["HAZARD_NOT_FOUND"])
        if ticket["rectify_status"] == "CLOSED":
            raise ServiceException(ERROR_CODES["HAZARD_CLOSED"])
        if ticket["rectify_status"] == "SUBMITTED":
            # 并发/刷新重复提交整改：第二次起直接冲突
            raise ServiceException(ERROR_CODES["HAZARD_STATUS_CONFLICT"], "整改已提交，等待复验，请勿重复提交")
        if ticket["rectify_status"] not in ("PENDING", "REJECTED"):
            raise ServiceException(ERROR_CODES["HAZARD_STATUS_CONFLICT"])

        snapshot = snapshot_state()
        try:
            with STORE_LOCK:
                locked = self.repo.find_by_id(ticket_id)
                if locked["rectify_status"] == "SUBMITTED":
                    raise ServiceException(ERROR_CODES["HAZARD_STATUS_CONFLICT"], "整改已提交，等待复验，请勿重复提交")
                if locked["rectify_status"] not in ("PENDING", "REJECTED"):
                    raise ServiceException(ERROR_CODES["HAZARD_STATUS_CONFLICT"])

                self.repo.update(
                    ticket_id,
                    rectify_status="SUBMITTED",
                    rectify_note=note,
                    submitted_by=user["id"],
                    review_note=""
                )
                self.audit_repo.append(
                    user["id"], LOG_TEMPLATES["HazardTicket"][2],
                    "HazardTicket", ticket_id, f"整改提交：{note}"
                )
                return self.repo.find_by_id(ticket_id)
        except ServiceException:
            restore_state(snapshot)
            raise
        except Exception as exc:
            restore_state(snapshot)
            from src.exceptions import ServiceException as _SE
            raise _SE("VALIDATION_FAILED", str(exc)) from exc

    def review(self, ticket_id, payload, user):
        """复验：只能由原巡检员执行。通过才关闭并恢复设备可用；不通过退回整改。"""
        from src.constants.error_codes import ERROR_CODES

        ticket = self.repo.find_by_id(ticket_id)
        if ticket is None:
            raise ServiceException(ERROR_CODES["HAZARD_NOT_FOUND"])
        if ticket["rectify_status"] == "CLOSED":
            raise ServiceException(ERROR_CODES["HAZARD_CLOSED"])
        if ticket["rectify_status"] != "SUBMITTED":
            raise ServiceException(ERROR_CODES["HAZARD_STATUS_CONFLICT"], "隐患单尚未提交整改，无法复验")

        result = self.result_repo.find_by_id(ticket["result_id"])
        if result is None:
            raise ServiceException(ERROR_CODES["RESULT_NOT_FOUND"])
        original_inspector_id = ticket.get("inspector_id") or result.get("inspector_id")
        if original_inspector_id is None or int(user["id"]) != int(original_inspector_id):
            raise ServiceException(ERROR_CODES["NOT_ORIGINAL_INSPECTOR"])

        review_note = (payload.review_note or "").strip()
        if not payload.approved and not review_note:
            raise ServiceException(ERROR_CODES["REVIEW_NOTE_REQUIRED"])

        snapshot = snapshot_state()
        try:
            with STORE_LOCK:
                locked = self.repo.find_by_id(ticket_id)
                if locked["rectify_status"] == "CLOSED":
                    raise ServiceException(ERROR_CODES["HAZARD_CLOSED"])
                if locked["rectify_status"] != "SUBMITTED":
                    raise ServiceException(ERROR_CODES["HAZARD_STATUS_CONFLICT"])
                # 并发复验：进入临界区后再次确认复验人身份
                if int(user["id"]) != int(locked.get("inspector_id") or result.get("inspector_id")):
                    raise ServiceException(ERROR_CODES["NOT_ORIGINAL_INSPECTOR"])

                ts = now_iso()
                if payload.approved:
                    self.repo.update(
                        ticket_id,
                        rectify_status="CLOSED",
                        review_note=review_note or "复验通过",
                        closed_at=ts
                    )
                    # 只有复验通过，设备才恢复可用
                    self.device_repo.update_status(result["device_id"], "AVAILABLE")
                    self.audit_repo.append(
                        user["id"], LOG_TEMPLATES["HazardTicket"][3],
                        "HazardTicket", ticket_id, f"复验通过：{review_note or '无'}"
                    )
                    self.audit_repo.append(
                        user["id"], LOG_TEMPLATES["HazardTicket"][4],
                        "HazardTicket", ticket_id, f"闭环关闭于 {ts}"
                    )
                    self.audit_repo.append(
                        user["id"], LOG_TEMPLATES["FireDevice"][2],
                        "FireDevice", result["device_id"], "复验通过，恢复 AVAILABLE"
                    )
                else:
                    self.repo.update(
                        ticket_id,
                        rectify_status="REJECTED",
                        review_note=review_note
                    )
                    self.audit_repo.append(
                        user["id"], LOG_TEMPLATES["HazardTicket"][3],
                        "HazardTicket", ticket_id, f"复验不通过，退回整改：{review_note}"
                    )

                return self.repo.find_by_id(ticket_id)
        except ServiceException:
            restore_state(snapshot)
            raise
        except Exception as exc:
            restore_state(snapshot)
            from src.exceptions import ServiceException as _SE
            raise _SE("VALIDATION_FAILED", str(exc)) from exc
