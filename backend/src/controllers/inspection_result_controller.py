from src.exceptions import ServiceException
from src.services.inspection_result_service import InspectionResultService
from src.types.inspection_result_payload import InspectionResultPayload

service = InspectionResultService()


def list_inspection_result():
    return service.list()


def submit_inspection_result(payload: InspectionResultPayload, user: dict, idempotency_key: str = ""):
    # controller 层负责包装业务异常，禁止把校验失败静默吞在统一中间件里
    try:
        return service.submit(payload, user, idempotency_key)
    except ServiceException:
        raise
    except Exception as exc:  # pragma: no cover - 兜底包装
        raise ServiceException("VALIDATION_FAILED", f"巡检结果提交失败: {exc}") from exc
