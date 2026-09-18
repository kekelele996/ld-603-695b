# 消防设施巡检维保平台（fire-inspect）

面向园区和物业公司的消防设备巡检、隐患整改、维保计划和合规台账系统。核心是一条可操作的**隐患闭环**：异常结果自动派单 → 逾期自动升为严重 → 维保商整改 → 原巡检员复验 → 通过才关闭并恢复设备可用，全过程重复提交、并发复验、刷新重放都只生效一次，任一步校验失败隐患/设备/台账保持原状。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

- 前端：<http://localhost:20103>
- 后端健康检查：<http://localhost:21103/health>

页面右上角可切换登录身份（张巡/李检=巡检员，王维保=维保商，赵主管=物业主管），分别对应巡检提交、整改、复验等操作的按钮显隐与 RBAC 校验。

### 隐患闭环操作路径

1. **巡检任务页**：选择任务录入检查项，判定「异常」时同一事务内生成隐患单并停用设备；同任务同检查项重复提交按钮直接禁用，后端同样拒绝（409）。
2. **隐患整改页**（切换为维保商）：对「待整改」单据提交整改说明，状态变为「待复验」。
3. **隐患整改页**（切回原巡检员）：仅产生该异常结果的原巡检员可见「执行复验」；复验通过 → 单据关闭、设备恢复可用；复验不通过 → 退回整改，设备维持停用。
4. **设备台账页**：实时展示停用/可用与关联隐患单号；**总览/报表页**按状态展示逾期升级、闭环率等指标。

## 本地开发方式

```bash
# 后端（端口 8000；开发机可用 21103）
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload --port 21103

# 前端（vite 已配置 /api 反代到 http://127.0.0.1:21103）
cd frontend
npm install
VITE_API_TARGET=http://127.0.0.1:21103 npm run dev
```

后端测试：

```bash
cd backend && python -m pytest tests/ -q          # 10 个接口用例（含真实 uvicorn 并发复验）
node tests/e2e_smoke.mjs                           # jsdom 加载真实构建产物的页面冒烟（需先启动后端）
```

## 闭环规则与一致性保证

| 规则 | 实现位置 |
|---|---|
| 异常结果才生成隐患单 | `InspectionResultService.submit` / `HazardTicketService.create_from_result`，NORMAL 派单返回 `RESULT_NOT_ABNORMAL` |
| 同一巡检结果仅一张有效隐患单 | `HazardTicketRepository.find_active_by_result`（OPEN/RECTIFIED/REJECTED）+ 插入前判定，冲突返回 `DUPLICATE_ACTIVE_HAZARD` |
| 逾期自动升为严重 | 读/写路径统一调用 `_auto_escalate_overdue`，超过 `deadline` 且未关闭 → `CRITICAL`（只升不降，`escalated=true`） |
| 整改提交只生效一次 | 仅 OPEN/REJECTED 可提交，第二个请求读到 RECTIFIED 返回 `HAZARD_NOT_OPEN`，整改说明不被覆盖 |
| 仅原巡检员可复验 | 复验经 result→task 反查 `inspector_id`，与登录用户比对，不符返回 `NOT_ORIGINAL_INSPECTOR`(403)；角色再由 RBAC 依赖拦截 |
| 通过才关闭并恢复设备 | 复验通过在同一事务内置 CLOSED、写 closed_at、设备 AVAILABLE；不通过退回 REJECTED，设备不动 |
| 重复提交/并发/重放只生效一次 | ① 进程锁 `RLock`；② 快照事务（深拷贝回滚）；③ 写接口幂等键 `Idempotency-Key`（同键同体回放首响、同键异体 409）；④ DB 唯一约束 `uq_hazard_active_per_result`、`UNIQUE(task_id,item_code)` |
| 校验失败保持原状 | `Store.transaction()` 对全部受管表做深拷贝快照，异常整体还原；前端失败后强制 `refreshAll()` 回到服务端权威状态 |

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Material UI 依赖（自建轻组件）+ Zustand |
| 后端 | FastAPI + Python 3.11 + Pydantic v2（内存仓储 + 进程锁/快照事务） |
| 数据库 | PostgreSQL 15（`init.sql` 提供关系结构与唯一约束） |
| 部署 | Docker Compose（db/backend/frontend 三服务，healthcheck + 依赖编排） |

## 项目目录结构

```text
frontend/src/
├── api/           # 统一 /api 请求封装、幂等键、身份头、按实体分文件
├── stores/        # DataStore 聚合台账 + AuthStore 身份 + 各实体 store
├── types/         # 共享类型
├── constants/     # 枚举、错误码、错误消息、日志模板、状态文案
├── constructors/  # 默认对象/表单/响应构造器
├── components/common/  # StatusBadge/HazardSeverityTag/ChecklistPanel/DeviceLocationCell/TimelineList/StatCard/EmptyState
├── components/hazard/  # HazardCard/HazardActions/HazardFilterBar/ResultSubmitForm
├── hooks/         # useHazardFlow（状态机+幂等键+错误回滚刷新）等
├── pages/         # Dashboard/Devices/Tasks/Hazards/Reports
├── router/ utils/ mocks/
backend/src/
├── routes/ controllers/ services/ models/ repositories/
├── middlewares/   # auth / rbac / audit_log / error_handler
├── constants/     # 枚举、错误码/消息、日志模板、BusinessError
├── constructors/ types/ utils/ config/
backend/tests/     # pytest 闭环用例 + jsdom 端到端冒烟
```

## 环境变量说明

| 变量 | 默认值 | 说明 |
|---|---|---|
| `COMPOSE_PROJECT_NAME` | `fire-inspect` | Compose 项目名与容器名前缀 |
| `FRONTEND_PORT` | `20103` | 前端宿主机端口（容器内 80） |
| `BACKEND_PORT` | `21103` | 后端宿主机端口（容器内 8000） |
| `DB_PORT` | `54320` | PostgreSQL 宿主机端口 |
| `DB_NAME / DB_USER / DB_PASSWORD` | `app_db/app_user/app_password` | 数据库凭据 |
| `VITE_API_TARGET`（仅本地开发） | `http://127.0.0.1:21103` | Vite `/api` 反代目标 |

## Docker 部署说明

- 根 Compose 不写 `version`，顶层 `name: fire-inspect`；容器名均带 `${COMPOSE_PROJECT_NAME:-fire-inspect}` 前缀。
- db 配置 healthcheck，backend `depends_on: condition: service_healthy`；backend 自身 `/health` healthcheck，frontend 依赖 backend 健康。
- 数据库使用命名卷 `db_data`，不绑定挂载，中文目录名也可正常启动。
- nginx：`location /api/` 反代 `http://backend:8000/`，其余路径 `try_files $uri $uri/ /index.html;`。
- 常见问题：端口占用改 `.env` 后 `docker compose up -d`；重置数据 `docker compose down -v`；日志 `docker compose logs -f backend`。

## 状态枚举

- 巡检结果 `InspectionResultStatus`：`NORMAL` 正常 / `ABNORMAL` 异常
- 隐患等级 `HazardSeverity`：`LOW` 低 / `MEDIUM` 中 / `HIGH` 高 / `CRITICAL` 严重（逾期自动升级目标）
- 整改状态 `RectifyStatus`：`OPEN` 待整改 / `RECTIFIED` 待复验 / `REJECTED` 复验驳回 / `CLOSED` 已关闭
- 设备状态 `DeviceStatus`：`AVAILABLE` 可用 / `UNAVAILABLE` 停用

### 枚举/常量出现位置清单

- **DeviceType**（EXTINGUISHER/HYDRANT/SMOKE_DETECTOR/SPRINKLER/EXIT_LIGHT）
  - 前端：`constants/DeviceType.ts`、`types/FireDevice.ts`、`constructors/FireDeviceConstructor.ts`、`utils/formatters.ts(formatDeviceType)`、`mocks/seedData.ts`、设备页筛选与 `DeviceLocationCell`
  - 后端：`constants/device_type.py`、`models/fire_device.py`、`constructors/fire_device_factory.py`、`seed.py`
- **InspectionStatus**（PLANNED/IN_PROGRESS/SUBMITTED/REVIEWED/OVERDUE）
  - 前端：`constants/InspectionStatus.ts`、`types/InspectionTask.ts`、`constructors/InspectionTaskConstructor.ts`、`utils/formatters.ts`、任务页筛选/`StatusBadge`
  - 后端：`constants/inspection_status.py`、`models/inspection_task.py`、`seed.py`
- **HazardSeverity**（LOW/MEDIUM/HIGH/CRITICAL）
  - 前端：`constants/HazardSeverity.ts`、`types/HazardTicket.ts`、`constructors/HazardTicketConstructor.ts`、`utils/formatters.ts(formatRisk)`、`constants/logTemplates.ts`、异常提交表单分级选择、`HazardSeverityTag`、总览/隐患/报表页
  - 后端：`constants/hazard_severity.py(escalate)`、`models/hazard_ticket.py`、`constructors/hazard_ticket_factory.py`、`services/hazard_ticket_service.py`、`constants/log_templates.py`、错误码 `INVALID_SEVERITY`
- 其余闭环常量：`constants/RectifyStatus.ts`、`constants/DeviceStatus.ts`、`constants/InspectionResultStatus.ts`、`constants/UserRole.ts`（前端）与 `constants/rectify_status.py`、`device_status.py`、`inspection_result_status.py`（后端）；错误码/消息分别在 `constants/errorCodes.ts`+`errorMessages.ts` 与 `constants/error_codes.py`+`error_messages.py` 两侧对齐。

## 为什么会牵一发动全身

隐患状态被刻意拆散到枚举、类型、构造器、错误码/消息、日志模板、仓储查询、service 事务、controller、路由 RBAC、store、hook、页面组件与展示徽标中。例如把复验通过条件从「RECTIFIED」改成别的状态，需要同时修改：`RectifyStatus` 常量与文案、`deriveHazardActions`、`HazardActions` 按钮显隐、service 状态机判定、错误码 `HAZARD_NOT_RECTIFIED`、时间线模板与 `init.sql` 部分索引——任何一处遗漏都会让闭环或台账不一致。

## License

MIT
