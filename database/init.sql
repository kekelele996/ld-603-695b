-- 消防设施巡检维保平台初始化脚本
-- 运行时台账以应用内存种子为准（本系统禁止接入第三方 API），
-- 本脚本给出与后端模型一致的关系结构，便于审计与后续持久化接入。

CREATE TABLE IF NOT EXISTS building (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  campus TEXT,
  floor_count TEXT,
  fire_grade TEXT,
  manager_id INTEGER,
  address_code TEXT
);

CREATE TABLE IF NOT EXISTS fire_device (
  id INTEGER PRIMARY KEY,
  building_id INTEGER REFERENCES building(id),
  device_code TEXT NOT NULL,
  device_type TEXT NOT NULL,        -- EXTINGUISHER/HYDRANT/SMOKE_DETECTOR/SPRINKLER/EXIT_LIGHT
  floor TEXT,
  location_desc TEXT,
  install_date TEXT,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',  -- AVAILABLE/UNAVAILABLE：隐患在管停用，复验关闭恢复
  next_maintenance_at TEXT
);

CREATE TABLE IF NOT EXISTS inspection_task (
  id INTEGER PRIMARY KEY,
  building_id INTEGER REFERENCES building(id),
  inspector_id INTEGER NOT NULL,    -- 复验时校验必须为该任务的原巡检员
  plan_date TEXT,
  task_type TEXT,
  status TEXT,                      -- PLANNED/IN_PROGRESS/SUBMITTED/REVIEWED/OVERDUE
  checklist_version TEXT,
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS inspection_result (
  id INTEGER PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES inspection_task(id),
  device_id INTEGER NOT NULL REFERENCES fire_device(id),
  item_code TEXT NOT NULL,
  result_status TEXT NOT NULL,      -- NORMAL/ABNORMAL
  measured_value TEXT,
  photo_url TEXT,
  note TEXT,
  created_at TEXT,
  -- 同一任务同一检查项只能提交一次（重复提交/刷新重放只生效一次）
  UNIQUE (task_id, item_code)
);

CREATE TABLE IF NOT EXISTS hazard_ticket (
  id INTEGER PRIMARY KEY,
  result_id INTEGER NOT NULL REFERENCES inspection_result(id),
  device_id INTEGER NOT NULL REFERENCES fire_device(id),
  severity TEXT NOT NULL,           -- LOW/MEDIUM/HIGH/CRITICAL，逾期自动升级 CRITICAL
  owner_id INTEGER NOT NULL,
  deadline TEXT NOT NULL,
  rectify_status TEXT NOT NULL,     -- OPEN/RECTIFIED/REJECTED/CLOSED
  rectify_note TEXT,
  rectified_at TEXT,
  reinspect_note TEXT,
  closed_at TEXT,
  created_at TEXT,
  escalated BOOLEAN NOT NULL DEFAULT FALSE
);

-- 同一巡检结果只能有一张有效（未关闭）隐患单；关闭后的历史单允许留存
CREATE UNIQUE INDEX IF NOT EXISTS uq_hazard_active_per_result
  ON hazard_ticket (result_id)
  WHERE rectify_status IN ('OPEN', 'RECTIFIED', 'REJECTED');

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY,
  actor INTEGER,
  action TEXT,
  template TEXT,
  target_type TEXT,
  target_id TEXT,
  detail JSONB,
  created_at TEXT
);
