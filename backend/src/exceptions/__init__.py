from src.constants.error_codes import ERROR_CODES
from src.constants.error_messages import ERROR_MESSAGES


class ServiceException(Exception):
    """service 层抛出的业务异常，由 controller 层包装成 HTTP 响应；禁止在中间件里静默吞掉。"""

    def __init__(self, code: str, message: str | None = None):
        self.code = code if code in ERROR_CODES else "VALIDATION_FAILED"
        self.message = message or ERROR_MESSAGES.get(self.code, "invalid payload")
        super().__init__(self.message)
