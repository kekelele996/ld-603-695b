import copy
import threading

from src.seed import seed

# 进程内全局锁：重复提交、并发复验、刷新重放在同一临界区内只生效一次。
# 所有对 seed 内存台账的写操作必须经由这把锁。
STORE_LOCK = threading.RLock()

# 幂等键台账：key -> 已提交的巡检结果 id（刷新重放命中后直接返回原结果）
IDEMPOTENCY_KEYS: dict[str, int] = {}

# 隐患闭环事务里可能被改动的全部台账：失败时逐表整体恢复，保证隐患、设备、日志台账保持原状
_TX_TABLES = ("hazardTicket", "inspectionResult", "fireDevice", "auditLog")


def snapshot_state():
    """在临界区内对受管台账做深拷贝快照。"""
    with STORE_LOCK:
        return {
            "tables": {name: copy.deepcopy(seed[name]) for name in _TX_TABLES},
            "idempotency_keys": dict(IDEMPOTENCY_KEYS)
        }


def restore_state(snapshot):
    """业务校验失败时整体回滚，不允许留下半张隐患单或被改动的设备状态。"""
    with STORE_LOCK:
        for name, rows in snapshot["tables"].items():
            seed[name] = rows
        IDEMPOTENCY_KEYS.clear()
        IDEMPOTENCY_KEYS.update(snapshot["idempotency_keys"])
