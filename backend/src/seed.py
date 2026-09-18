seed = {
  "user": [
    {"id": 1, "name": "张巡检", "role": "INSPECTOR"},
    {"id": 2, "name": "周巡查", "role": "INSPECTOR"},
    {"id": 3, "name": "李维保", "role": "MAINTAINER"},
    {"id": 4, "name": "王主管", "role": "SUPERVISOR"},
    {"id": 5, "name": "赵审计", "role": "AUDITOR"}
  ],
  "building": [
    {
      "id": 1,
      "name": "研发楼A座",
      "campus": "云溪科技园",
      "floor_count": 6,
      "fire_grade": "一级",
      "manager_id": 4,
      "address_code": "330106-A01"
    },
    {
      "id": 2,
      "name": "研发楼B座",
      "campus": "云溪科技园",
      "floor_count": 8,
      "fire_grade": "一级",
      "manager_id": 4,
      "address_code": "330106-B02"
    },
    {
      "id": 3,
      "name": "综合楼",
      "campus": "云溪科技园",
      "floor_count": 12,
      "fire_grade": "二级",
      "manager_id": 4,
      "address_code": "330106-C03"
    }
  ],
  "fireDevice": [
    {
      "id": 1,
      "building_id": 1,
      "device_code": "XH-001",
      "device_type": "HYDRANT",
      "floor": "1F",
      "location_desc": "A座大堂东侧消火栓",
      "install_date": "2024-03-10",
      "status": "AVAILABLE",
      "next_maintenance_at": "2026-12-01"
    },
    {
      "id": 2,
      "building_id": 1,
      "device_code": "YG-002",
      "device_type": "SMOKE_DETECTOR",
      "floor": "3F",
      "location_desc": "A座3层弱电井烟感",
      "install_date": "2023-11-22",
      "status": "UNAVAILABLE",
      "next_maintenance_at": "2026-10-01"
    },
    {
      "id": 3,
      "building_id": 2,
      "device_code": "PS-003",
      "device_type": "SPRINKLER",
      "floor": "2F",
      "location_desc": "B座2层茶水间喷淋管网末端",
      "install_date": "2023-05-18",
      "status": "UNAVAILABLE",
      "next_maintenance_at": "2026-10-15"
    },
    {
      "id": 4,
      "building_id": 2,
      "device_code": "MH-004",
      "device_type": "EXTINGUISHER",
      "floor": "1F",
      "location_desc": "B座门厅手提式灭火器",
      "install_date": "2025-01-09",
      "status": "AVAILABLE",
      "next_maintenance_at": "2026-11-20"
    },
    {
      "id": 5,
      "building_id": 3,
      "device_code": "SS-005",
      "device_type": "EXIT_LIGHT",
      "floor": "5F",
      "location_desc": "综合楼5层疏散指示灯",
      "install_date": "2024-08-30",
      "status": "AVAILABLE",
      "next_maintenance_at": "2026-12-10"
    }
  ],
  "inspectionTask": [
    {
      "id": 1,
      "building_id": 1,
      "inspector_id": 1,
      "plan_date": "2026-09-10",
      "task_type": "MONTHLY",
      "status": "REVIEWED",
      "checklist_version": "v2026.09",
      "finished_at": "2026-09-10T17:20:00Z"
    },
    {
      "id": 2,
      "building_id": 2,
      "inspector_id": 2,
      "plan_date": "2026-09-12",
      "task_type": "MONTHLY",
      "status": "SUBMITTED",
      "checklist_version": "v2026.09",
      "finished_at": "2026-09-12T18:05:00Z"
    },
    {
      "id": 3,
      "building_id": 3,
      "inspector_id": 1,
      "plan_date": "2026-09-18",
      "task_type": "WEEKLY",
      "status": "IN_PROGRESS",
      "checklist_version": "v2026.09",
      "finished_at": ""
    }
  ],
  "inspectionResult": [
    {
      "id": 1,
      "task_id": 1,
      "device_id": 1,
      "item_code": "HYDRANT_PRESSURE",
      "result_status": "NORMAL",
      "measured_value": "0.35MPa",
      "photo_url": "/mock/photo-1.png",
      "note": "水压正常",
      "submitted": False,
      "inspector_id": 1
    },
    {
      "id": 2,
      "task_id": 1,
      "device_id": 2,
      "item_code": "SMOKE_TRIGGER",
      "result_status": "ABNORMAL",
      "measured_value": "无响应",
      "photo_url": "/mock/photo-2.png",
      "note": "加烟试验无报警，疑似探测器故障",
      "submitted": True,
      "inspector_id": 1
    },
    {
      "id": 3,
      "task_id": 2,
      "device_id": 3,
      "item_code": "SPRINKLER_PRESSURE",
      "result_status": "ABNORMAL",
      "measured_value": "0.02MPa",
      "photo_url": "/mock/photo-3.png",
      "note": "末端试水压力严重不足",
      "submitted": True,
      "inspector_id": 2
    },
    {
      "id": 4,
      "task_id": 2,
      "device_id": 4,
      "item_code": "GAUGE_PRESSURE",
      "result_status": "ABNORMAL",
      "measured_value": "压力表红区",
      "photo_url": "/mock/photo-4.png",
      "note": "灭火器压力不足，待提交异常判定",
      "submitted": False,
      "inspector_id": 2
    },
    {
      "id": 5,
      "task_id": 3,
      "device_id": 5,
      "item_code": "EXIT_LAMP_CHECK",
      "result_status": "NORMAL",
      "measured_value": "点亮正常",
      "photo_url": "/mock/photo-5.png",
      "note": "疏散指示正常",
      "submitted": False,
      "inspector_id": 1
    }
  ],
  "hazardTicket": [
    {
      "id": 1,
      "result_id": 2,
      "severity": "HIGH",
      "owner_id": 3,
      "deadline": "2026-09-15T18:00:00Z",
      "rectify_status": "PENDING",
      "rectify_note": "",
      "closed_at": "",
      "created_at": "2026-09-10T17:30:00Z",
      "submitted_by": None,
      "review_note": "",
      "inspector_id": 1
    },
    {
      "id": 2,
      "result_id": 3,
      "severity": "MEDIUM",
      "owner_id": 3,
      "deadline": "2026-09-25T18:00:00Z",
      "rectify_status": "SUBMITTED",
      "rectify_note": "已更换喷淋支管阀门并完成末端试水复测",
      "closed_at": "",
      "created_at": "2026-09-12T18:20:00Z",
      "submitted_by": 3,
      "review_note": "",
      "inspector_id": 2
    }
  ],
  "auditLog": []
}
