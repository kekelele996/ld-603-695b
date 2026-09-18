"""隐患闭环接口测试：异常派单、逾期升级、整改、原巡检员复验、
重复提交/并发复验/刷新重放只生效一次、校验失败整体回滚。"""
import copy
import threading

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.seed import idempotency_index, seed
from src.repositories.store import store


@pytest.fixture()
def client():
    # 每个用例重置内存种子与幂等索引，保证初始状态一致
    store.reset(copy.deepcopy(seed))
    idempotency_index.clear()
    return TestClient(app)


def test_overdue_auto_escalated(client):
    rows = client.get("/api/hazard-ticket").json()
    h1002 = next(h for h in rows if h["id"] == 1002)
    assert h1002["severity"] == "CRITICAL" and h1002["escalated"] is True
    h1001 = next(h for h in rows if h["id"] == 1001)
    assert h1001["severity"] == "HIGH"  # 未逾期不升级


def test_reinspect_requires_original_inspector_and_runs_once(client):
    # 1002 属于任务2（inspector=2），用户1复验被拒
    r = client.post("/api/hazard-ticket/1002/reinspect",
                    json={"passed": True}, headers={"x-user-id": "1"})
    assert r.status_code == 403 and r.json()["code"] == "NOT_ORIGINAL_INSPECTOR"
    assert client.get("/api/hazard-ticket/1002").json()["rectify_status"] == "RECTIFIED"

    # 原巡检员复验通过
    r = client.post("/api/hazard-ticket/1002/reinspect",
                    json={"passed": True, "reinspect_note": "联动正常"},
                    headers={"x-user-id": "2"})
    assert r.status_code == 200 and r.json()["rectify_status"] == "CLOSED"
    # 设备恢复可用
    assert next(d for d in client.get("/api/fire-device").json() if d["id"] == 4)["status"] == "AVAILABLE"
    # 再复验被挡：只生效一次
    r = client.post("/api/hazard-ticket/1002/reinspect",
                    json={"passed": True}, headers={"x-user-id": "2"})
    assert r.status_code == 409 and r.json()["code"] == "HAZARD_NOT_RECTIFIED"


def test_rectify_submit_once_and_validation_no_mutation(client):
    r = client.post("/api/hazard-ticket/1001/rectify",
                    json={"rectify_note": "已更换密封件"}, headers={"x-user-id": "3"})
    assert r.status_code == 200 and r.json()["rectify_status"] == "RECTIFIED"
    # 重复整改提交被挡
    r = client.post("/api/hazard-ticket/1001/rectify",
                    json={"rectify_note": "重复提交"}, headers={"x-user-id": "3"})
    assert r.status_code == 409 and r.json()["code"] == "HAZARD_NOT_OPEN"
    # 空说明校验失败：原整改说明保持不变
    r = client.post("/api/hazard-ticket/1001/rectify",
                    json={"rectify_note": "   "}, headers={"x-user-id": "3"})
    assert r.status_code == 422
    assert client.get("/api/hazard-ticket/1001").json()["rectify_note"] == "已更换密封件"


def test_reject_then_rectify_again_then_close(client):
    client.post("/api/hazard-ticket/1001/rectify",
                json={"rectify_note": "整改一次"}, headers={"x-user-id": "3"})
    r = client.post("/api/hazard-ticket/1001/reinspect",
                    json={"passed": False, "reinspect_note": "仍漏水"},
                    headers={"x-user-id": "1"})
    assert r.json()["rectify_status"] == "REJECTED"
    # 驳回期间设备维持停用
    assert next(d for d in client.get("/api/fire-device").json() if d["id"] == 6)["status"] == "UNAVAILABLE"
    assert client.post("/api/hazard-ticket/1001/rectify",
                       json={"rectify_note": "二次整改完成"},
                       headers={"x-user-id": "3"}).status_code == 200
    r = client.post("/api/hazard-ticket/1001/reinspect",
                    json={"passed": True, "reinspect_note": "合格"},
                    headers={"x-user-id": "1"})
    assert r.json()["rectify_status"] == "CLOSED"
    assert next(d for d in client.get("/api/fire-device").json() if d["id"] == 6)["status"] == "AVAILABLE"


def test_abnormal_submit_creates_ticket_and_locks_device(client):
    body = {"task_id": 1, "device_id": 2, "item_code": "PRESSURE_GAUGE",
            "result_status": "ABNORMAL", "measured_value": "0.1MPa",
            "note": "压力不足", "severity": "HIGH", "owner_id": 3,
            "deadline": "2026-09-25T18:00:00Z"}
    r = client.post("/api/inspection-result/submit", json=body, headers={"x-user-id": "1"})
    assert r.status_code == 200
    assert "hazard_ticket" in r.json()
    assert next(d for d in client.get("/api/fire-device").json() if d["id"] == 2)["status"] == "UNAVAILABLE"
    # 同一检查项重复提交被挡
    r = client.post("/api/inspection-result/submit", json=body, headers={"x-user-id": "1"})
    assert r.status_code == 409 and r.json()["code"] == "RESULT_ITEM_DUPLICATED"


def test_one_active_ticket_per_result(client):
    body = {"task_id": 1, "device_id": 2, "item_code": "ITEM_X",
            "result_status": "ABNORMAL", "severity": "LOW", "owner_id": 3,
            "deadline": "2026-09-25T18:00:00Z"}
    client.post("/api/inspection-result/submit", json=body, headers={"x-user-id": "1"})
    result_id = client.get("/api/inspection-result").json()[-1]["id"]
    r = client.post("/api/hazard-ticket",
                    json={"result_id": result_id, "severity": "LOW", "owner_id": 3,
                          "deadline": "2026-09-26T18:00:00Z"},
                    headers={"x-user-id": "1"})
    assert r.status_code == 409 and r.json()["code"] == "DUPLICATE_ACTIVE_HAZARD"


def test_normal_result_no_ticket_and_cannot_open(client):
    before = len(client.get("/api/hazard-ticket").json())
    r = client.post("/api/inspection-result/submit",
                    json={"task_id": 1, "device_id": 1, "item_code": "HYDRANT_BOX",
                          "result_status": "NORMAL", "measured_value": "齐全"},
                    headers={"x-user-id": "1"})
    assert r.status_code == 200 and "hazard_ticket" not in r.json()
    assert len(client.get("/api/hazard-ticket").json()) == before
    rid = r.json()["id"]
    r = client.post("/api/hazard-ticket",
                    json={"result_id": rid, "severity": "LOW", "owner_id": 3,
                          "deadline": "2026-09-26T18:00:00Z"},
                    headers={"x-user-id": "1"})
    assert r.status_code == 422 and r.json()["code"] == "RESULT_NOT_ABNORMAL"
    assert next(d for d in client.get("/api/fire-device").json() if d["id"] == 1)["status"] == "AVAILABLE"


def test_device_mismatch_rolls_back(client):
    n = len(client.get("/api/inspection-result").json())
    r = client.post("/api/inspection-result/submit",
                    json={"task_id": 1, "device_id": 4, "item_code": "X",
                          "result_status": "NORMAL"},
                    headers={"x-user-id": "1"})
    assert r.status_code == 422 and r.json()["code"] == "TASK_DEVICE_MISMATCH"
    assert len(client.get("/api/inspection-result").json()) == n


def test_idempotency_replay_and_conflict(client):
    body = {"task_id": 1, "device_id": 3, "item_code": "SMOKE_LOOP",
            "result_status": "ABNORMAL", "note": "离线", "severity": "CRITICAL",
            "owner_id": 3, "deadline": "2026-09-21T18:00:00Z"}
    h1 = client.post("/api/inspection-result/submit", json=body,
                     headers={"x-user-id": "1", "Idempotency-Key": "k-001"}).json()
    n = len(client.get("/api/hazard-ticket").json())
    h2 = client.post("/api/inspection-result/submit", json=body,
                     headers={"x-user-id": "1", "Idempotency-Key": "k-001"}).json()
    assert h1["hazard_ticket"]["id"] == h2["hazard_ticket"]["id"]
    assert len(client.get("/api/hazard-ticket").json()) == n
    r = client.post("/api/inspection-result/submit", json={**body, "note": "改过"},
                    headers={"x-user-id": "1", "Idempotency-Key": "k-001"})
    assert r.status_code == 409 and r.json()["code"] == "IDEMPOTENCY_REPLAYED"


def test_concurrent_reinspect_only_one_wins():
    # TestClient 的 portal 会串行化请求，真实并发用独立 uvicorn 进程验证
    import json
    import subprocess
    import sys
    import time
    import urllib.error
    import urllib.request

    port = 8210
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "src.main:app",
         "--host", "127.0.0.1", "--port", str(port)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    base = f"http://127.0.0.1:{port}"
    try:
        for _ in range(50):
            try:
                urllib.request.urlopen(f"{base}/health", timeout=1)
                break
            except OSError:
                time.sleep(0.1)

        def post(path, body, headers=None):
            req = urllib.request.Request(
                f"{base}{path}", data=json.dumps(body).encode(),
                headers={"Content-Type": "application/json", **(headers or {})}, method="POST")
            try:
                return urllib.request.urlopen(req, timeout=5).status
            except urllib.error.HTTPError as exc:
                return exc.code

        # 1001 OPEN -> RECTIFIED，再两个线程并发复验
        assert post("/api/hazard-ticket/1001/rectify",
                    {"rectify_note": "并发测试整改"}, {"x-user-id": "3"}) == 200
        outcomes = []

        def call():
            outcomes.append(post("/api/hazard-ticket/1001/reinspect",
                                 {"passed": True}, {"x-user-id": "1"}))

        threads = [threading.Thread(target=call) for _ in range(2)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        assert sorted(outcomes) == [200, 409]
    finally:
        proc.terminate()
        proc.wait(timeout=5)
