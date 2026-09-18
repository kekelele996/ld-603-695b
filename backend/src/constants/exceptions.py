class BusinessError(Exception):
    """Service/controller 分层共用的业务异常，携带错误码与 HTTP 状态码。"""

    def __init__(self, code: str, message: str = "", status_code: int = 400):
        super().__init__(message or code)
        self.code = code
        self.status_code = status_code
