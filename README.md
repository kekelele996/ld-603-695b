# 消防设施巡检维保平台

面向园区和物业公司的消防设备巡检、隐患整改、维保计划和合规台账系统。核心是一条可操作的**隐患整改闭环**：
巡检异常 → 自动生成隐患单并停用设备 → 逾期自动升级为严重 → 维保商提交整改 → 原巡检员复验 → 通过才关闭并恢复设备可用。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

启动完成后：

- 前端：<http://localhost:20103>
- 后端健康检查：<http://localhost:21103/health>

### 页面操作路径（隐患闭环演示）

1. 左下角「当前演示身份」先选择 **张巡检（巡检员）** 或 **周巡查（巡检员）**。
2. 进入 **巡检任务** 页，对未判定的检查项选择「异常」，选择隐患等级与整改期限后提交：
   - 异常提交自动生成隐患单，设备台账状态变为「停用」；
   - 同一检查项重复点击、刷新页面后重放，都只会保留第一张隐患单。
3. 切换身份为 **李维保（维保商）**，进入 **隐患整改** 页对待整改单填写整改说明并提交。
4. 切回 **原巡检员**（其他人复验会被拒绝），对「待复验」单点击「复验通过并关闭」或「复验不通过」：
   - 通过：隐患单关闭，设备恢复「可用」；
   - 不通过：退回维保商重新整改，设备保持停用。
5. 种子数据中隐患单 #1 的整改期限已过期，打开隐患/总览页会自动升级为「严重」并记录日志。
6. **合规报表** 页可看到巡检提交、建单、逾期升级、整改、复验关闭的完整操作日志台账。

### 闭环规则（后端强约束）

| 规则 | 实现位置 |
|---|---|
| 只有异常结果才建隐患单，正常结果不建单 | `services/inspection_result_service.py` |
| 同一巡检结果只能有一张有效隐患单（PENDING/SUBMITTED/REJECTED） | service 临界区二次校验 + 结果 `submitted` 标记 + `init.sql` 部分唯一索引 |
| 重复提交 / 并发复验只生效一次 | `repositories/store_lock.py`（进程锁 + 事务快照），接口临界区内二次校验，冲突返回 409 |
| 刷新 / 重放只生效一次 | `Idempotency-Key` 幂等键台账（命中返回首次结果，`replayed=true`） |
| 整改后只能由原巡检员复验 | `hazard_ticket_service.review` 比对 `inspector_id`，不符返回 403 |
| 复验通过才关闭并恢复设备 AVAILABLE；驳回退回整改且设备保持 UNAVAILABLE | `hazard_ticket_service.review` |
| 逾期未闭环自动升为 CRITICAL | 列表读取时惰性升级 + 后台 30 秒巡检任务，动作幂等并写日志 |
| 任一步校验失败，隐患、设备、台账保持原状 | 写操作前深拷贝快照，任何异常整体回滚（`restore_state`） |
| 角色权限 | 巡检员提交/复验；维保商整改；审计员只读（RBAC 依赖返回 403） |

## 本地开发方式

- 前端：`cd frontend && npm install && npm run dev`（Vite，端口 20103；已开启 `/api` 到 21103 的 CORS）
- 后端：`cd backend && pip install -r requirements.txt && uvicorn src.main:app --reload --port 21103`，接口统一挂在 `/api`。
- 演示身份通过请求头 `X-User-Id`（1 张巡检 / 2 周巡查 / 3 李维保 / 4 王主管 / 5 赵审计）传递，前端在左下角切换。
- 写接口：
  - `POST /api/inspection-result/submit`（头 `Idempotency-Key` 防重放）
  - `POST /api/hazard-ticket/{id}/rectify`
  - `POST /api/hazard-ticket/{id}/review`
  - `GET /api/hazard-ticket?status=PENDING|SUBMITTED|REJECTED|CLOSED`
  - `GET /api/audit-log`

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Material UI + Zustand |
| 后端 | FastAPI + Python 3.11 + Pydantic v2（SQLAlchemy 2.0 驱动表结构，运行时种子内存库） |
| 数据库 | PostgreSQL 15（`init.sql` 建表，含有效隐患单部分唯一索引） |
| 部署 | Docker Compose |

## 项目目录结构

```text
frontend/src/api, stores, types, constants, constructors, components/common, hooks, pages, router, utils, mocks
backend/src/routes, controllers, services, models, repositories, middlewares, constants, constructors, utils, types, config, exceptions
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`: Compose 项目名，默认 `fire-inspect`
- `FRONTEND_PORT`: 前端端口，默认 `20103`
- `BACKEND_PORT`: 后端端口，默认 `21103`
- `DB_PORT`: 数据库宿主机端口，默认 `54320`
- `DB_NAME/DB_USER/DB_PASSWORD`: 数据库凭据
- `JWT_SECRET`: 演示用签名密钥

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: fire-inspect`。
- 容器名均使用 `${COMPOSE_PROJECT_NAME:-fire-inspect}` 前缀。
- 数据库使用命名卷 `db_data`，不绑定挂载中文路径；配置 healthcheck，后端 `depends_on: condition: service_healthy`。
- 前端 Nginx 将 `/api/` 反代到 `http://backend:8000/api/`，并以 `try_files` 支持单页路由。
- 常见问题：端口占用时修改 `.env` 中端口后重启；重置数据执行 `docker compose down -v`。

## 枚举/常量出现位置清单

- **DeviceType**（EXTINGUISHER/HYDRANT/SMOKE_DETECTOR/SPRINKLER/EXIT_LIGHT）
  - 后端：`constants/device_type.py`、`seed.py`、`database/init.sql`
  - 前端：`constants/DeviceType.ts`、`types/DeviceType.ts`、`utils/formatters.ts`、`mocks/seedData.ts`、`components/common/DeviceLocationCell.tsx`、设备台账页
- **InspectionStatus**（PLANNED/IN_PROGRESS/SUBMITTED/REVIEWED/OVERDUE）
  - 后端：`constants/inspection_status.py`、任务种子数据
  - 前端：`constants/InspectionStatus.ts`、`types/InspectionStatus.ts`、`constants/statusText.ts`、任务页 `StatusBadge`
- **HazardSeverity**（LOW/MEDIUM/HIGH/CRITICAL）
  - 后端：`constants/hazard_severity.py`、`constants/rectify_status.py`（逾期升级目标）、异常提交校验、`constructors/hazard_ticket_factory.py`
  - 前端：`constants/HazardSeverity.ts`、`types/HazardSeverity.ts`、`HazardSeverityTag`、`ChecklistPanel` 等级下拉、隐患页/总览页、`formatters.formatRisk`
- **RectifyStatus**（PENDING/SUBMITTED/REJECTED/CLOSED，隐患闭环新增）
  - 后端：`constants/rectify_status.py`、隐患 service/repository、错误码/错误消息、日志模板
  - 前端：`constants/RectifyStatus.ts`、`hooks/useHazardFlow.ts`、隐患页筛选与卡片、设备页关联隐患、总览待办
- **InspectionResultStatus**（NORMAL/ABNORMAL）与 **DeviceStatus**（AVAILABLE/UNAVAILABLE）
  - 后端：`constants/inspection_result_status.py`、`constants/device_status.py`
  - 前端：`constants/InspectionResultStatus.ts`、`constants/DeviceStatus.ts`、提交表单与台账状态点

## 为什么会牵一发动全身

异常建单与复验关闭这一条链路横跨：枚举常量（结果判定、隐患等级、整改状态、设备状态）、错误码/错误消息、日志模板、构造器工厂、repository 事务与锁、service 校验与回滚、controller 包装、route 的 RBAC 依赖、前端类型/store/hook/API/组件/页面/审计台账以及 `init.sql` 索引。修改任何一个状态或校验，都需要同步上述多层，符合本项目刻意拆分、多层直接引用的结构。

## License

MIT
