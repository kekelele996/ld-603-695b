from fastapi import Request
from fastapi.responses import JSONResponse

from src.constants.exceptions import BusinessError


def to_error_payload(exc: Exception) -> dict:
    return {"code": getattr(exc, "code", "INTERNAL_ERROR"), "message": str(exc)}


async def business_error_handler(request: Request, exc: BusinessError) -> JSONResponse:
    """业务异常统一出口：service/controller 各自包装过的错误码在此转响应。"""
    return JSONResponse(status_code=exc.status_code, content=to_error_payload(exc))


async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content=to_error_payload(exc))
