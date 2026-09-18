// 与 backend/src/seed.py 对齐的本地种子数据，接口不可达时作为离线兜底。
export const mockData = {
  user: [
    { id: 1, name: "张巡", role: "INSPECTOR" },
    { id: 2, name: "李检", role: "INSPECTOR" },
    { id: 3, name: "王维保", role: "MAINTAINER" },
    { id: 4, name: "赵主管", role: "SUPERVISOR" }
  ],
  building: [
    { id: 1, name: "创新大厦A座", campus: "南山区科技园", floor_count: "6", fire_grade: "一级", manager_id: 4, address_code: "440305-A01" },
    { id: 2, name: "研发中心B座", campus: "南山区科技园", floor_count: "4", fire_grade: "二级", manager_id: 4, address_code: "440305-B02" }
  ],
  fireDevice: [
    { id: 1, building_id: 1, device_code: "FH-101", device_type: "HYDRANT", floor: "1F", location_desc: "A座大堂东侧消火栓", install_date: "2024-03-12T09:00:00Z", status: "AVAILABLE", next_maintenance_at: "2026-12-01T09:00:00Z" },
    { id: 2, building_id: 1, device_code: "FE-203", device_type: "EXTINGUISHER", floor: "2F", location_desc: "A座2层电梯厅灭火器箱", install_date: "2024-05-20T09:00:00Z", status: "AVAILABLE", next_maintenance_at: "2026-11-10T09:00:00Z" },
    { id: 3, building_id: 1, device_code: "SD-305", device_type: "SMOKE_DETECTOR", floor: "3F", location_desc: "A座3层走廊烟感", install_date: "2023-11-02T09:00:00Z", status: "AVAILABLE", next_maintenance_at: "2026-10-20T09:00:00Z" },
    { id: 4, building_id: 2, device_code: "SP-B01", device_type: "SPRINKLER", floor: "B1", location_desc: "B座地下车库湿式报警阀", install_date: "2023-06-18T09:00:00Z", status: "UNAVAILABLE", next_maintenance_at: "2026-09-30T09:00:00Z" },
    { id: 5, building_id: 2, device_code: "EL-102", device_type: "EXIT_LIGHT", floor: "1F", location_desc: "B座一层疏散通道应急灯", install_date: "2024-09-01T09:00:00Z", status: "AVAILABLE", next_maintenance_at: "2026-12-15T09:00:00Z" },
    { id: 6, building_id: 1, device_code: "FH-408", device_type: "HYDRANT", floor: "4F", location_desc: "A座4层弱电井旁消火栓", install_date: "2023-08-09T09:00:00Z", status: "UNAVAILABLE", next_maintenance_at: "2026-10-05T09:00:00Z" }
  ],
  inspectionTask: [
    { id: 1, building_id: 1, inspector_id: 1, plan_date: "2026-09-18T09:00:00Z", task_type: "MONTHLY", status: "IN_PROGRESS", checklist_version: "CL-2026-09", finished_at: "", device_ids: [1, 2, 3] },
    { id: 2, building_id: 2, inspector_id: 2, plan_date: "2026-09-15T09:00:00Z", task_type: "WEEKLY", status: "IN_PROGRESS", checklist_version: "CL-2026-09", finished_at: "", device_ids: [4, 5] },
    { id: 3, building_id: 1, inspector_id: 1, plan_date: "2026-08-25T09:00:00Z", task_type: "MONTHLY", status: "REVIEWED", checklist_version: "CL-2026-08", finished_at: "2026-08-28T17:30:00Z", device_ids: [2, 3, 6] }
  ],
  inspectionResult: [
    { id: 1, task_id: 3, device_id: 6, item_code: "WATER_PRESSURE", result_status: "ABNORMAL", measured_value: "0.12MPa", photo_url: "/mock/fh408.png", note: "栓口压力明显低于标准0.35MPa", created_at: "2026-08-26T10:12:00Z" },
    { id: 2, task_id: 2, device_id: 4, item_code: "ALARM_VALVE", result_status: "ABNORMAL", measured_value: "不动作", photo_url: "/mock/spb01.png", note: "末端试水后湿式报警阀延迟报警超过5分钟", created_at: "2026-09-15T14:40:00Z" },
    { id: 3, task_id: 3, device_id: 3, item_code: "SMOKE_TEST", result_status: "ABNORMAL", measured_value: "离线", photo_url: "/mock/sd305.png", note: "烟感探头离线，主机收不到报警信号", created_at: "2026-08-26T11:05:00Z" },
    { id: 4, task_id: 3, device_id: 2, item_code: "GAUGE_PRESSURE", result_status: "NORMAL", measured_value: "1.35MPa", photo_url: "/mock/fe203.png", note: "压力表指针在绿区", created_at: "2026-08-26T10:30:00Z" }
  ],
  hazardTicket: [
    { id: 1001, result_id: 1, device_id: 6, severity: "HIGH", owner_id: 3, deadline: "2026-09-22T18:00:00Z", rectify_status: "OPEN", rectify_note: "", rectified_at: "", reinspect_note: "", closed_at: "", created_at: "2026-08-26T10:20:00Z", escalated: false },
    { id: 1002, result_id: 2, device_id: 4, severity: "HIGH", owner_id: 3, deadline: "2026-09-16T18:00:00Z", rectify_status: "RECTIFIED", rectify_note: "已更换延迟器并重新整定报警阀，末端试水联动正常。", rectified_at: "2026-09-17T16:10:00Z", reinspect_note: "", closed_at: "", created_at: "2026-09-15T15:00:00Z", escalated: false },
    { id: 1003, result_id: 3, device_id: 3, severity: "MEDIUM", owner_id: 3, deadline: "2026-09-02T18:00:00Z", rectify_status: "CLOSED", rectify_note: "已清洗探头并重接总线回路，主机恢复在线。", rectified_at: "2026-08-29T15:20:00Z", reinspect_note: "烟感测试报警正常，同意关闭。", closed_at: "2026-08-30T10:00:00Z", created_at: "2026-08-26T11:20:00Z", escalated: false }
  ]
} as const;
