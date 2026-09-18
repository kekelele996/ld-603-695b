"""内存数据存储 + 进程级互斥锁 + 快照事务。

隐患闭环要求“任一步校验失败时隐患、设备和台账保持原状”，
UnitOfWork 在进入时对全部受管表做深拷贝快照，异常时整体回滚，
并在锁内提交，保证重复提交与并发复验只生效一次。
"""
import copy
import threading
from collections.abc import Iterator
from contextlib import contextmanager

from src.seed import seed

_LOCK = threading.RLock()


class Store:
    def __init__(self) -> None:
        self._tables = seed

    def table(self, name: str) -> list[dict]:
        return self._tables[name]

    def find(self, name: str, entity_id: int) -> dict | None:
        return next((row for row in self._tables[name] if row["id"] == entity_id), None)

    def next_id(self, name: str) -> int:
        rows = self._tables[name]
        return max((row["id"] for row in rows), default=0) + 1

    def reset(self, tables: dict) -> None:
        """测试支持：用一份全新种子替换全部受管表（同对象引用，仓库无需重建）。"""
        self._tables.clear()
        self._tables.update(tables)

    @contextmanager
    def transaction(self) -> Iterator[None]:
        with _LOCK:
            snapshot = copy.deepcopy(self._tables)
            try:
                yield
            except Exception:
                # 校验失败：隐患单、设备状态、巡检结果台账整体还原
                for key, rows in self._tables.items():
                    self._tables[key] = snapshot[key]
                raise


store = Store()
