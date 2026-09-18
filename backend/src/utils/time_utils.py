from datetime import datetime, timezone


def now_iso() -> str:
    """统一 UTC ISO 时间，供隐患建单、关闭与日志台账使用。"""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_iso(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))
