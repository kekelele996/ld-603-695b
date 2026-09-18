ERROR_MESSAGES = {
    "AUTH_REQUIRED": "missing token",
    "RBAC_DENIED": "role denied",
    "VALIDATION_FAILED": "invalid payload",
    "RATE_LIMITED": "too many requests",
    # 隐患闭环业务错误消息
    "RESULT_NOT_FOUND": "巡检结果不存在",
    "RESULT_ALREADY_SUBMITTED": "该巡检结果已提交，不能重复提交",
    "HAZARD_ALREADY_EXISTS": "同一巡检结果只能存在一张有效隐患单",
    "NORMAL_RESULT_NO_HAZARD": "正常结果不能生成隐患单",
    "HAZARD_NOT_FOUND": "隐患单不存在",
    "HAZARD_STATUS_CONFLICT": "隐患单当前状态不允许该操作",
    "RECTIFY_NOTE_REQUIRED": "整改说明不能为空",
    "NOT_ORIGINAL_INSPECTOR": "复验只能由原巡检员执行",
    "REVIEW_NOTE_REQUIRED": "复验意见不能为空",
    "DEVICE_NOT_FOUND": "巡检结果未关联有效设备",
    "INVALID_RESULT_STATUS": "巡检结果判定只能是 NORMAL 或 ABNORMAL",
    "INVALID_SEVERITY": "隐患等级不合法",
    "DEADLINE_REQUIRED": "异常隐患单必须填写整改期限",
    "HAZARD_CLOSED": "隐患单已关闭，不能继续操作"
}
