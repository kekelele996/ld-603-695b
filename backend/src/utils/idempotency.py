"""幂等键支持：刷新重放/重试携带相同 Idempotency-Key 时返回首次结果，只生效一次。

缓存条目为 {"body_hash": 归一化请求体哈希, "response": 首次响应}：
- 同键同体：回放首次响应，不重复执行写操作
- 同键异体：视为重放冲突，拒绝并保持原状
"""
import copy
import hashlib
import json

from src.seed import idempotency_index
from src.constants import error_codes, error_messages
from src.constants.exceptions import BusinessError


def body_hash(body: dict) -> str:
    raw = json.dumps(body, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def lookup(key: str | None, body: dict) -> tuple[str, dict | None]:
    """返回 (状态, 回放响应)。状态为 hit / conflict / miss。"""
    if not key:
        return "miss", None
    entry = idempotency_index.get(key)
    if entry is None:
        return "miss", None
    if entry["body_hash"] != body_hash(body):
        raise BusinessError(
            error_codes.ERROR_CODES["IDEMPOTENCY_REPLAYED"],
            error_messages.ERROR_MESSAGES["IDEMPOTENCY_REPLAYED"],
            409,
        )
    return "hit", copy.deepcopy(entry["response"])


def remember(key: str | None, body: dict, response: dict) -> dict:
    if key:
        idempotency_index[key] = {"body_hash": body_hash(body),
                                  "response": copy.deepcopy(response)}
    return response
