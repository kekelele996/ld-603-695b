-- 隐患闭环相关表结构（运行时由后端种子数据装载；此脚本保证 PostgreSQL 容器初始化即可用）

CREATE TABLE IF NOT EXISTS building (
  id INTEGER PRIMARY KEY,
  name TEXT,
  campus TEXT,
  floor_count INTEGER,
  fire_grade TEXT,
  manager_id INTEGER,
  address_code TEXT
);

CREATE TABLE IF NOT EXISTS fire_device (
  id INTEGER PRIMARY KEY,
  building_id INTEGER,
  device_code TEXT,
  device_type TEXT,          -- DeviceType: EXTINGUISHER/HYDRANT/SMOKE_DETECTOR/SPRINKLER/EXIT_LIGHT
  floor TEXT,
  location_desc TEXT,
  install_date TEXT,
  status TEXT,               -- DeviceStatus: AVAILABLE / UNAVAILABLE（隐患未闭环期间停用）
  next_maintenance_at TEXT
);

CREATE TABLE IF NOT EXISTS inspection_task (
  id INTEGER PRIMARY KEY,
  building_id INTEGER,
  inspector_id INTEGER,
  plan_date TEXT,
  task_type TEXT,
  status TEXT,               -- InspectionStatus
  checklist_version TEXT,
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS inspection_result (
  id INTEGER PRIMARY KEY,
  task_id INTEGER,
  device_id INTEGER,
  item_code TEXT,
  result_status TEXT,        -- InspectionResultStatus: NORMAL / ABNORMAL
  measured_value TEXT,
  photo_url TEXT,
  note TEXT,
  submitted BOOLEAN DEFAULT FALSE,
  inspector_id INTEGER
);

-- 同一巡检结果只允许一张有效隐患单（PENDING/SUBMITTED/REJECTED）
-- 由后端临界区 + 结果 submitted 标记共同保证；这里加唯一索引作为持久化层兜底
CREATE TABLE IF NOT EXISTS hazard_ticket (
  id INTEGER PRIMARY KEY,
  result_id INTEGER,
  severity TEXT,             -- HazardSeverity: LOW/MEDIUM/HIGH/CRITICAL（逾期自动升 CRITICAL）
  owner_id INTEGER,
  deadline TEXT,
  rectify_status TEXT,       -- RectifyStatus: PENDING/SUBMITTED/REJECTED/CLOSED
  rectify_note TEXT,
  closed_at TEXT,
  created_at TEXT,
  submitted_by INTEGER,
  review_note TEXT,
  inspector_id INTEGER       -- 原巡检员：复验只允许该用户
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_hazard_active_result
  ON hazard_ticket(result_id)
  WHERE rectify_status IN ('PENDING', 'SUBMITTED', 'REJECTED');

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY,
  actor_id INTEGER,
  action TEXT,
  target_type TEXT,
  target_id TEXT,
  detail TEXT,
  created_at TEXT
);
