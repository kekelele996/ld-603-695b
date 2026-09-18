import asyncio
import contextlib
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.middlewares.audit_log_middleware import audit_log_middleware
from src.middlewares.auth_middleware import auth_middleware
from src.routes.audit_log_routes import router as audit_log_router
from src.routes.building_routes import router as building_router
from src.routes.fire_device_routes import router as fire_device_router
from src.routes.hazard_ticket_routes import router as hazard_ticket_router
from src.routes.inspection_result_routes import router as inspection_result_router
from src.routes.inspection_task_routes import router as inspection_task_router
from src.services.hazard_ticket_service import HazardTicketService

app = FastAPI(title="消防设施巡检维保平台")

# 本地开发时 Vite(20103) 直连后端(21103)；容器内统一走 nginx /api 反代
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.middleware("http")(auth_middleware)
app.middleware("http")(audit_log_middleware)


@app.get("/health")
def health():
    return {"status": "ok", "service": "fire-inspect", "time": datetime.now(timezone.utc).isoformat()}


async def _overdue_escalation_loop():
    """逾期隐患自动升为严重：服务存活期间每 30 秒巡检一次。"""
    service = HazardTicketService()
    while True:
        await asyncio.sleep(30)
        await asyncio.to_thread(service.list)  # list 内部驱动升级并写操作日志


@asynccontextmanager
async def lifespan(_app: FastAPI):
    task = asyncio.create_task(_overdue_escalation_loop())
    try:
        yield
    finally:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


app.router.lifespan_context = lifespan

app.include_router(building_router)
app.include_router(fire_device_router)
app.include_router(inspection_task_router)
app.include_router(inspection_result_router)
app.include_router(hazard_ticket_router)
app.include_router(audit_log_router)
