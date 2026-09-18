# 隐患整改闭环状态：
# PENDING    待整改（逾期自动升为严重 CRITICAL）
# SUBMITTED  整改已提交，等待原巡检员复验
# REJECTED   复验不通过，退回重新整改
# CLOSED     复验通过，闭环关闭，设备恢复 AVAILABLE
RectifyStatus = ["PENDING", "SUBMITTED", "REJECTED", "CLOSED"]

# 逾期自动升级后的等级
OVERDUE_SEVERITY = "CRITICAL"

# 判定为「有效隐患单」的状态（同一巡检结果只允许存在一张）
ACTIVE_STATUSES = ["PENDING", "SUBMITTED", "REJECTED"]
