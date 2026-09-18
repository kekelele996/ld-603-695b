import { create } from "zustand";
import { listAuditLog } from "../api/AuditLog";
import type { AuditLog } from "../types/AuditLog";

type State = { rows: AuditLog[]; loading: boolean; load: () => Promise<void> };

export const useAuditLogStore = create<State>((set) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    try {
      set({ rows: await listAuditLog(), loading: false });
    } catch {
      // 审计台账仅作展示，失败时保留空表
      set({ loading: false, rows: [] });
    }
  }
}));
