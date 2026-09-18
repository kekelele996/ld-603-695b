"""巡检结果服务：异常判定在同一事务内完成“结果落台账 + 隐患派单 + 设备停用”。"""
import copy
import datetime

from src.constants import error_codes, error_messages
from src.constants.exceptions import BusinessError
from src.constants.log_templates import LOG_TEMPLATES
from src.constructors.hazard_ticket_factory import create_hazard_ticket_row
from src.constructors.inspection_result_factory import (
    create_inspection_result_response,
    create_inspection_result_row,
)
from src.repositories.fire_device_repository import FireDeviceRepository
from src.repositories.hazard_ticket_repository import HazardTicketRepository
from src.repositories.inspection_result_repository import InspectionResultRepository
from src.repositories.inspection_task_repository import InspectionTaskRepository
from src.repositories.store import store
from src.utils.audit import audit


def _error(code: str, status_code: int = 400) -> BusinessError:
    return BusinessError(code, error_messages.ERROR_MESSAGES[code], status_code)


def _parse(value: str) -> datetime.datetime:
    return datetime.datetime.fromisoformat(value.replace("Z", "+00:00"))


class InspectionResultService:
    def __init__(self) -> None:
        self.repo = InspectionResultRepository()
        self.task_repo = InspectionTaskRepository()
        self.device_repo = FireDeviceRepository()
        self.hazard_repo = HazardTicketRepository()

    def list(self) -> list[dict]:
        return [create_inspection_result_response(row) for row in self.repo.find_all()]

    def submit(self, payload: dict, user_id: int | None = None) -> dict:
        task_id = payload["task_id"]
        device_id = payload["device_id"]
        item_code = payload["item_code"].strip()
        result_status = payload["result_status"]

        if result_status not in ("NORMAL", "ABNORMAL"):
            raise _error(error_codes.ERROR_CODES["INVALID_RESULT_STATUS"], 422)
        is_abnormal = result_status == "ABNORMAL"
        if is_abnormal:
            if not payload.get("owner_id"):
                raise _error(error_codes.ERROR_CODES["VALIDATION_FAILED"], 422)
            try:
                _parse(payload["deadline"])
            except (ValueError, TypeError):
                raise _error(error_codes.ERROR_CODES["VALIDATION_FAILED"], 422)

        with store.transaction():
            task = self.task_repo.find_by_id(task_id)
            if task is None:
                raise _error(error_codes.ERROR_CODES["TASK_NOT_FOUND"], 404)

            device = self.device_repo.find_by_id(device_id)
            if device is None:
                raise _error(error_codes.ERROR_CODES["DEVICE_NOT_FOUND"], 404)
            if device_id not in task.get("device_ids", []):
                raise _error(error_codes.ERROR_CODES["TASK_DEVICE_MISMATCH"], 422)

            # 同一任务的同一检查项只能提交一次：重复提交/刷新重放在此被挡下
            if self.repo.find_by_task_item(task_id, item_code) is not None:
                raise _error(error_codes.ERROR_CODES["RESULT_ITEM_DUPLICATED"], 409)

            result_row = create_inspection_result_row(
                result_id=store.next_id("inspectionResult"),
                task_id=task_id,
                device_id=device_id,
                item_code=item_code,
                result_status=result_status,
                measured_value=payload.get("measured_value", ""),
                photo_url=payload.get("photo_url", ""),
                note=payload.get("note", ""),
            )
            self.repo.insert(result_row)

            if not is_abnormal:
                audit("INSPECTION_NORMAL",
                      LOG_TEMPLATES["InspectionResult"][5].format(
                          result_id=result_row["id"], task_id=task_id, device_id=device_id),
                      user_id, {"result_id": result_row["id"]})
                return create_inspection_result_response(copy.deepcopy(result_row))

            # 异常：同一结果只允许一张有效隐患单（二次异常提交时同 item_code 已先被挡）
            if self.hazard_repo.find_active_by_result(result_row["id"]) is not None:
                raise _error(error_codes.ERROR_CODES["DUPLICATE_ACTIVE_HAZARD"], 409)

            ticket = create_hazard_ticket_row(
                ticket_id=store.next_id("hazardTicket"),
                result_id=result_row["id"],
                device_id=device_id,
                severity=payload["severity"],
                owner_id=payload["owner_id"],
                deadline=payload["deadline"],
            )
            self.hazard_repo.insert(ticket)

            if device["status"] != "UNAVAILABLE":
                self.device_repo.update(device, status="UNAVAILABLE")
                audit("DEVICE_LOCK",
                      LOG_TEMPLATES["FireDevice"][4].format(device_id=device_id),
                      user_id, {"device_id": device_id, "ticket_id": ticket["id"]})

            audit("INSPECTION_ABNORMAL",
                  LOG_TEMPLATES["InspectionResult"][4].format(
                      result_id=result_row["id"], task_id=task_id, device_id=device_id),
                  user_id, {"result_id": result_row["id"], "ticket_id": ticket["id"]})
            audit("HAZARD_OPEN",
                  LOG_TEMPLATES["HazardTicket"][4].format(
                      ticket_id=ticket["id"], result_id=result_row["id"],
                      severity=ticket["severity"]),
                  user_id, {"result_id": result_row["id"], "owner_id": ticket["owner_id"]})

            return {
                "result": create_inspection_result_response(copy.deepcopy(result_row)),
                "hazard_ticket": {
                    "id": ticket["id"], "result_id": ticket["result_id"],
                    "device_id": ticket["device_id"], "severity": ticket["severity"],
                    "owner_id": ticket["owner_id"], "deadline": ticket["deadline"],
                    "rectify_status": ticket["rectify_status"]
                }
            }
