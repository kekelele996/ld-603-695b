import { create } from "zustand";
import { listBuilding } from "../api/Building";
import { listFireDevice } from "../api/FireDevice";
import { listInspectionResult } from "../api/InspectionResult";
import { listHazardTicket } from "../api/HazardTicket";
import { listInspectionTask } from "../api/InspectionTask";
import { listUser } from "../api/User";
import type { Building } from "../types/Building";
import type { FireDevice } from "../types/FireDevice";
import type { HazardTicket } from "../types/HazardTicket";
import type { InspectionResult } from "../types/InspectionResult";
import type { InspectionTask } from "../types/InspectionTask";
import type { User } from "../types/User";

// 台账数据由各实体 store 分片，这里集中 bootstrap / 刷新，
// 保证隐患写操作后隐患单、设备、巡检结果三处视图一致。
type DataState = {
  users: User[];
  buildings: Building[];
  devices: FireDevice[];
  tasks: InspectionTask[];
  results: InspectionResult[];
  hazards: HazardTicket[];
  ready: boolean;        // 首次加载完成前展示整屏 loading，之后保持 true，避免刷新时卸载页面丢状态
  refreshing: boolean;
  bootstrapped: boolean;
  bootstrap: () => Promise<void>;
  refreshAll: () => Promise<void>;
};

export const useDataStore = create<DataState>((set, get) => ({
  users: [],
  buildings: [],
  devices: [],
  tasks: [],
  results: [],
  hazards: [],
  ready: false,
  refreshing: false,
  bootstrapped: false,
  async bootstrap() {
    if (get().bootstrapped) {
      await get().refreshAll();
      return;
    }
    await get().refreshAll();
    set({ bootstrapped: true });
  },
  async refreshAll() {
    const firstLoad = !get().bootstrapped;
    set(firstLoad ? { ready: false } : { refreshing: true });
    const [users, buildings, devices, tasks, results, hazards] = await Promise.all([
      listUser(),
      listBuilding(),
      listFireDevice(),
      listInspectionTask(),
      listInspectionResult(),
      listHazardTicket() // 读隐患列表即触发后端逾期自动升级
    ]);
    set({ users, buildings, devices, tasks, results, hazards, ready: true, refreshing: false });
  }
}));
