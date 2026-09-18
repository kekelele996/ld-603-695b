def to_error_payload(exc):
    """统一错误信封构造；异常仍由 service/controller 分别抛出，不在这里静默吞掉。"""
    return {"code": getattr(exc, "code", "INTERNAL_ERROR"), "message": str(exc)}
