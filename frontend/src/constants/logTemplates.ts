// 操作日志模板：字段/状态变更时必须与后端 log_templates、调用处同步
export const LOG_TEMPLATES = {
  Building: ["建筑楼栋创建", "建筑楼栋更新", "建筑楼栋状态变更", "建筑楼栋导出"],
  FireDevice: [
    "消防设备创建",
    "消防设备更新",
    "消防设备状态变更",
    "消防设备导出",
    "隐患停用设备 device={device_id}",
    "复验通过恢复设备 device={device_id}"
  ],
  InspectionTask: ["巡检任务创建", "巡检任务更新", "巡检任务状态变更", "巡检任务导出"],
  InspectionResult: [
    "巡检结果创建",
    "巡检结果更新",
    "巡检结果状态变更",
    "巡检结果导出",
    "异常结果提交 result={result_id} 自动派单",
    "正常结果提交 result={result_id}"
  ],
  HazardTicket: [
    "隐患整改单创建",
    "隐患整改单更新",
    "隐患整改单状态变更",
    "隐患整改单导出",
    "隐患派单 ticket={ticket_id} severity={severity}",
    "逾期自动升级 ticket={ticket_id} -> 严重",
    "整改提交 ticket={ticket_id}",
    "复验通过 ticket={ticket_id} inspector={inspector_id}",
    "复验驳回 ticket={ticket_id} inspector={inspector_id}",
    "隐患关闭 ticket={ticket_id} 设备恢复可用"
  ]
};
