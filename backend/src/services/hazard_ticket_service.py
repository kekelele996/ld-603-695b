"""隐患整改单服务：派单、逾期升级、整改、原巡检员复验、关闭恢复设备。

所有写操作都在 Store.transaction 快照事务中执行：
- 校验全部通过后才落库；任何一步失败，隐患单/设备/台账整体回滚原状
- 事务持锁，重复提交与并发复验只有一个请求能赢
"""
import copy
import datetime

from src.constants import error_codes, error_messages
from src.constants.exceptions import BusinessError
from src.constants.hazard_severity import HazardSeverity, escalate
from src.constants.log_templates import LOG_TEMPLATES
from src.constructors.hazard_ticket_factory import (
    create_hazard_ticket_response,
    create_hazard_ticket_row,
    now_iso,
)
from src.repositories.fire_device_repository import FireDeviceRepository
from src.repositories.hazard_ticket_repository import HazardTicketRepository
from src.repositories.inspection_result_repository import InspectionResultRepository
from src.repositories.inspection_task_repository import InspectionTaskRepository
from src.repositories.store import store
from src.utils.audit import audit

_ACTIVE = ("OPEN", "RECTIFIED", "REJECTED")


def _error(code: str, status_code: int = 400) -> BusinessError:
    return BusinessError(code, error_messages.ERROR_MESSAGES[code], status_code)


def _parse(value: str) -> datetime.datetime:
    return datetime.datetime.fromisoformat(value.replace("Z", "+00:00"))


class HazardTicketService:
    def __init__(self) -> None:
        self.repo = HazardTicketRepository()
        self.result_repo = InspectionResultRepository()
        self.task_repo = InspectionTaskRepository()
        self.device_repo = FireDeviceRepository()

    # ---- 查询（读路径也做逾期自动升级，同样走事务保证一致） ----

    def list(self) -> list[dict]:
        with store.transaction():
            self._auto_escalate_overdue()
            return [create_hazard_ticket_response(row) for row in self.repo.find_all()]

    def detail(self, ticket_id: int) -> dict:
        with store.transaction():
            self._auto_escalate_overdue()
            row = self.repo.find_by_id(ticket_id)
            if row is None:
                raise _error(error_codes.ERROR_CODES["HAZARD_NOT_FOUND"], 404)
            return create_hazard_ticket_response(row)

    def _auto_escalate_overdue(self) -> None:
        """有效隐患单超过整改期限且尚未关闭：自动升为严重（只升不降）。"""
        now = datetime.datetime.now(datetime.timezone.utc)
        for row in self.repo.find_all():
            if row["rectify_status"] not in _ACTIVE or not row["deadline"]:
                continue
            try:
                overdue = _parse(row["deadline"]) < now
            except ValueError:
                continue
            if overdue and row["severity"] != "CRITICAL":
                old = row["severity"]
                row["severity"] = escalate(row["severity"], "CRITICAL")
                row["escalated"] = True
                audit("HAZARD_ESCALATE",
                      LOG_TEMPLATES["HazardTicket"][5].format(
                          ticket_id=row["id"], old_severity=old, new_severity="CRITICAL"),
                      detail={"ticket_id": row["id"], "reason": "overdue"})

    # ---- 派单 ----

    def create_from_result(self, result_id: int, severity: str, owner_id: int,
                           deadline: str, user_id: int | None = None) -> dict:
        if severity not in HazardSeverity:
            raise _error(error_codes.ERROR_CODES["INVALID_SEVERITY"], 422)
        try:
            _parse(deadline)
        except ValueError:
            raise _error(error_codes.ERROR_CODES["VALIDATION_FAILED"], 422)

        with store.transaction():
            result = self.result_repo.find_by_id(result_id)
            if result is None:
                raise _error(error_codes.ERROR_CODES["RESULT_NOT_FOUND"], 404)
            if result["result_status"] != "ABNORMAL":
                raise _error(error_codes.ERROR_CODES["RESULT_NOT_ABNORMAL"], 422)

            # 同一巡检结果只能有一张有效隐患单：先做只读判定，插入在锁内完成
            existing = self.repo.find_active_by_result(result_id)
            if existing is not None:
                raise _error(error_codes.ERROR_CODES["DUPLICATE_ACTIVE_HAZARD"], 409)

            ticket = create_hazard_ticket_row(
                ticket_id=store.next_id("hazardTicket"),
                result_id=result_id,
                device_id=result["device_id"],
                severity=severity,
                owner_id=owner_id,
                deadline=deadline,
            )
            self.repo.insert(ticket)

            # 隐患在管期间设备停用
            device = self.device_repo.find_by_id(result["device_id"])
            if device is not None and device["status"] != "UNAVAILABLE":
                self.device_repo.update(device, status="UNAVAILABLE")
                audit("DEVICE_LOCK",
                      LOG_TEMPLATES["FireDevice"][4].format(device_id=device["id"],
                                                             user_id=user_id),
                      user_id=user_id, detail={"device_id": device["id"]})

            audit("HAZARD_OPEN",
                  LOG_TEMPLATES["HazardTicket"][4].format(
                      ticket_id=ticket["id"], result_id=result_id, severity=severity),
                  user_id, {"result_id": result_id, "owner_id": owner_id})
            return create_hazard_ticket_response(copy.deepcopy(ticket))

    # ---- 整改提交 ----

    def submit_rectification(self, ticket_id: int, rectify_note: str,
                             user_id: int | None = None) -> dict:
        if not rectify_note or not rectify_note.strip():
            raise _error(error_codes.ERROR_CODES["RECTIFY_NOTE_REQUIRED"], 422)

        with store.transaction():
            self._auto_escalate_overdue()
            ticket = self.repo.find_by_id(ticket_id)
            if ticket is None:
                raise _error(error_codes.ERROR_CODES["HAZARD_NOT_FOUND"], 404)

            # 仅 OPEN（或复验驳回后重新整改）可提交；并发第二个请求拿到的是
            # RECTIFIED，直接拒绝，整改说明不被覆盖
            if ticket["rectify_status"] not in ("OPEN", "REJECTED"):
                raise _error(error_codes.ERROR_CODES["HAZARD_NOT_OPEN"], 409)

            self.repo.update(ticket, rectify_status="RECTIFIED",
                             rectify_note=rectify_note.strip(), rectified_at=now_iso())
            audit("HAZARD_RECTIFY",
                  LOG_TEMPLATES["HazardTicket"][6].format(
                      ticket_id=ticket_id, owner_id=ticket["owner_id"]),
                  user_id, {"ticket_id": ticket_id})
            return create_hazard_ticket_response(copy.deepcopy(ticket))

    # ---- 原巡检员复验 ----

    def reinspect(self, ticket_id: int, passed: bool, reinspect_note: str,
                  user_id: int | None = None) -> dict:
        with store.transaction():
            self._auto_escalate_overdue()
            ticket = self.repo.find_by_id(ticket_id)
            if ticket is None:
                raise _error(error_codes.ERROR_CODES["HAZARD_NOT_FOUND"], 404)

            # 必须由产生该异常结果的原巡检员复验
            result = self.result_repo.find_by_id(ticket["result_id"])
            task = self.task_repo.find_by_id(result["task_id"]) if result else None
            if result is None or task is None:
                raise _error(error_codes.ERROR_CODES["RESULT_NOT_FOUND"], 404)
            if user_id is None or user_id != task["inspector_id"]:
                raise _error(error_codes.ERROR_CODES["NOT_ORIGINAL_INSPECTOR"], 403)

            # 只有整改已提交才能复验；并发复验的第二个请求读到 CLOSED，被挡下
            if ticket["rectify_status"] != "RECTIFIED":
                raise _error(error_codes.ERROR_CODES["HAZARD_NOT_RECTIFIED"], 409)

            if passed:
                ticket["rectify_status"] = "CLOSED"
                ticket["closed_at"] = now_iso()
                ticket["reinspect_note"] = reinspect_note.strip()

                device = self.device_repo.find_by_id(ticket["device_id"])
                if device is not None:
                    self.device_repo.update(device, status="AVAILABLE")
                    audit("DEVICE_RESTORE",
                          LOG_TEMPLATES["FireDevice"][5].format(device_id=device["id"]),
                          user_id, {"device_id": device["id"], "ticket_id": ticket_id})

                audit("HAZARD_REINSPECT_PASS",
                      LOG_TEMPLATES["HazardTicket"][7].format(
                          ticket_id=ticket_id, inspector_id=user_id),
                      user_id, {"ticket_id": ticket_id})
                audit("HAZARD_CLOSE",
                      LOG_TEMPLATES["HazardTicket"][9].format(
                          ticket_id=ticket_id, result_id=ticket["result_id"],
                          device_id=ticket["device_id"]),
                      user_id, {"ticket_id": ticket_id})
            else:
                # 复验不通过：退回整改，设备维持停用，台账不动
                ticket["rectify_status"] = "REJECTED"
                ticket["reinspect_note"] = reinspect_note.strip()
                audit("HAZARD_REINSPECT_REJECT",
                      LOG_TEMPLATES["HazardTicket"][8].format(
                          ticket_id=ticket_id, inspector_id=user_id),
                      user_id, {"ticket_id": ticket_id})

            return create_hazard_ticket_response(copy.deepcopy(ticket))
