export const ERROR_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  RESULT_NOT_FOUND: "巡检结果不存在",
  RESULT_NOT_ABNORMAL: "只有异常的巡检结果才能生成隐患单",
  RESULT_ITEM_DUPLICATED: "该检查项已提交过，请勿重复提交",
  TASK_NOT_FOUND: "巡检任务不存在",
  TASK_DEVICE_MISMATCH: "该设备不属于当前巡检任务",
  DEVICE_NOT_FOUND: "消防设备不存在",
  HAZARD_NOT_FOUND: "隐患单不存在",
  DUPLICATE_ACTIVE_HAZARD: "该巡检结果已存在有效隐患单",
  HAZARD_NOT_OPEN: "隐患单当前状态不可提交整改",
  HAZARD_NOT_RECTIFIED: "隐患单尚未提交整改，不能复验",
  NOT_ORIGINAL_INSPECTOR: "只有原巡检员才能复验该隐患",
  RECTIFY_NOTE_REQUIRED: "请填写整改说明",
  IDEMPOTENCY_REPLAYED: "请求已处理过，请勿刷新重放"
};

export function errorText(code?: string, fallback = "操作失败，数据保持原状"): string {
  return (code && ERROR_MESSAGES[code]) || fallback;
}
