LOG_TEMPLATES = {
    "Building": [
        "Building.create",
        "Building.update",
        "Building.status",
        "Building.export"
    ],
    "FireDevice": [
        "FireDevice.create",
        "FireDevice.update",
        "FireDevice.status",
        "FireDevice.export"
    ],
    "InspectionTask": [
        "InspectionTask.create",
        "InspectionTask.update",
        "InspectionTask.status",
        "InspectionTask.export"
    ],
    "InspectionResult": [
        "InspectionResult.submit",          # 巡检结果提交（正常/异常判定）
        "InspectionResult.abnormal",        # 异常判定并生成隐患单
        "InspectionResult.update",
        "InspectionResult.export"
    ],
    "HazardTicket": [
        "HazardTicket.create",              # 派单/异常自动建单
        "HazardTicket.escalate",            # 逾期自动升级为严重
        "HazardTicket.rectify",             # 整改提交
        "HazardTicket.review",              # 复验通过/驳回
        "HazardTicket.close",               # 复验通过关闭并恢复设备
        "HazardTicket.export"
    ]
}
