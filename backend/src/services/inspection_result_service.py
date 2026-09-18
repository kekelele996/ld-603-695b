from src.constants.hazard_severity import HazardSeverity
from src.constants.inspection_result_status import InspectionResultStatus
from src.constants.log_templates import LOG_TEMPLATES
from src.constructors.hazard_ticket_factory import build_new_hazard_ticket
from src.exceptions import ServiceException
from src.repositories.audit_log_repository import AuditLogRepository
from src.repositories.fire_device_repository import FireDeviceRepository
from src.repositories.hazard_ticket_repository import HazardTicketRepository
from src.repositories.inspection_result_repository import InspectionResultRepository
from src.repositories.store_lock import IDEMPOTENCY_KEYS, STORE_LOCK, restore_state, snapshot_state
from src.utils.time_utils import now_iso, parse_iso

DEFAULT_MAINTAINER_ID = 3
SYSTEM_ACTOR_ID = 0


class InspectionResultService:
    """巡检结果提交：异常判定原子建单并联动设备状态。"""

    def __init__(self):
        self.repo = InspectionResultRepository()
        self.hazard_repo = HazardTicketRepository()
        self.device_repo = FireDeviceRepository()
        self.audit_repo = AuditLogRepository()

    def list(self):
        return self.repo.find_all()

    def submit(self, payload, user, idempotency_key: str = ""):
        """提交巡检结果（正常 / 异常判定）。

        - 同一结果重复提交：第二次起冲突报错（只生效一次）
        - 携带同一幂等键的刷新重放：直接返回首次结果，不重复建单
        - 异常结果且尚无有效隐患单：原子建单并把设备置为 UNAVAILABLE
        - 任一步校验失败：隐患、设备、日志台账全部保持原状
        """
        from src.constants.error_codes import ERROR_CODES
        from src.constants.rectify_status import ACTIVE_STATUSES

        # 刷新重放：相同幂等键直接返回首次提交产物
        if idempotency_key:
            with STORE_LOCK:
                replayed_id = IDEMPOTENCY_KEYS.get(idempotency_key)
            if replayed_id is not None:
                replayed = self.repo.find_by_id(replayed_id)
                if replayed is not None:
                    ticket = self.hazard_repo.find_by_result_id(replayed_id)
                    return {"result": replayed, "hazard": ticket, "replayed": True}

        result = self.repo.find_by_id(payload.result_id)
        if result is None:
            raise ServiceException(ERROR_CODES["RESULT_NOT_FOUND"])

        # 进入事务前先做静态校验，失败时什么都还没改
        if payload.result_status not in InspectionResultStatus:
            raise ServiceException(ERROR_CODES["INVALID_RESULT_STATUS"])
        if result.get("submitted"):
            raise ServiceException(ERROR_CODES["RESULT_ALREADY_SUBMITTED"])
        if payload.result_status == "ABNORMAL":
            if payload.severity not in HazardSeverity:
                raise ServiceException(ERROR_CODES["INVALID_SEVERITY"])
            if not payload.deadline:
                raise ServiceException(ERROR_CODES["DEADLINE_REQUIRED"])
            try:
                parse_iso(payload.deadline)
            except (ValueError, TypeError):
                raise ServiceException(ERROR_CODES["VALIDATION_FAILED"], "整改期限必须是 ISO 时间格式")
            device = self.device_repo.find_by_id(result["device_id"])
            if device is None:
                raise ServiceException(ERROR_CODES["DEVICE_NOT_FOUND"])
        else:
            existing = self.hazard_repo.find_by_result_id(result["id"])
            if existing is not None and existing["rectify_status"] in ACTIVE_STATUSES:
                raise ServiceException(ERROR_CODES["HAZARD_ALREADY_EXISTS"])

        actor_id = user["id"]
        snapshot = snapshot_state()
        try:
            with STORE_LOCK:
                # 临界区内二次确认，挡掉并发重复提交
                locked_result = self.repo.find_by_id(payload.result_id)
                if locked_result is not None and locked_result.get("submitted"):
                    raise ServiceException(ERROR_CODES["RESULT_ALREADY_SUBMITTED"])

                ticket = None
                ts = now_iso()

                if payload.result_status == "NORMAL":
                    self.repo.update(
                        payload.result_id,
                        result_status="NORMAL",
                        measured_value=payload.measured_value or result.get("measured_value", ""),
                        note=payload.note or result.get("note", ""),
                        submitted=True,
                        inspector_id=actor_id
                    )
                    self.audit_repo.append(
                        actor_id, LOG_TEMPLATES["InspectionResult"][0],
                        "InspectionResult", payload.result_id, "判定：正常"
                    )
                else:
                    existing = self.hazard_repo.find_by_result_id(payload.result_id)
                    if existing is not None and existing["rectify_status"] in ACTIVE_STATUSES:
                        raise ServiceException(ERROR_CODES["HAZARD_ALREADY_EXISTS"])

                    self.repo.update(
                        payload.result_id,
                        result_status="ABNORMAL",
                        measured_value=payload.measured_value or result.get("measured_value", ""),
                        note=payload.note or result.get("note", ""),
                        submitted=True,
                        inspector_id=actor_id
                    )
                    ticket = self.hazard_repo.add(
                        build_new_hazard_ticket(
                            result,
                            severity=payload.severity,
                            deadline=payload.deadline,
                            owner_id=payload.owner_id or DEFAULT_MAINTAINER_ID,
                            now_iso=ts
                        )
                    )
                    # 异常设备立即停用，直到隐患复验通过
                    self.device_repo.update_status(result["device_id"], "UNAVAILABLE")
                    self.audit_repo.append(
                        actor_id, LOG_TEMPLATES["InspectionResult"][1],
                        "InspectionResult", payload.result_id,
                        f"判定：异常，生成隐患单 #{ticket['id']}（{payload.severity}）"
                    )
                    self.audit_repo.append(
                        actor_id, LOG_TEMPLATES["HazardTicket"][0],
                        "HazardTicket", ticket["id"],
                        f"派单责任人 {ticket['owner_id']}，期限 {ticket['deadline']}"
                    )
                    self.audit_repo.append(
                        actor_id, LOG_TEMPLATES["FireDevice"][2],
                        "FireDevice", result["device_id"], "异常停用：UNAVAILABLE"
                    )

                if idempotency_key:
                    IDEMPOTENCY_KEYS[idempotency_key] = payload.result_id

                saved_result = self.repo.find_by_id(payload.result_id)
                saved_ticket = self.hazard_repo.find_by_result_id(payload.result_id)
                return {"result": saved_result, "hazard": saved_ticket, "replayed": False}
        except ServiceException:
            restore_state(snapshot)
            raise
        except Exception as exc:  # 任何意外失败同样整体回滚，台账保持原状
            restore_state(snapshot)
            raise ServiceException("VALIDATION_FAILED", str(exc)) from exc
