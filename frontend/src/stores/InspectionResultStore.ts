import { create } from "zustand";
import { listInspectionResult, submitInspectionResult } from "../api/InspectionResult";
import type { InspectionResult, InspectionResultSubmitPayload } from "../types/InspectionResult";

type State = {
  rows: InspectionResult[];
  loading: boolean;
  actingId: number | null;
  error: string;
  lastReplayedId: number | null;
  load: () => Promise<void>;
  submit: (payload: InspectionResultSubmitPayload, idempotencyKey: string) => Promise<boolean>;
  clearError: () => void;
};

export const useInspectionResultStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  actingId: null,
  error: "",
  lastReplayedId: null,
  async load() {
    set({ loading: true, error: "" });
    try {
      set({ rows: await listInspectionResult(), loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "巡检结果加载失败" });
    }
  },
  async submit(payload, idempotencyKey) {
    set({ actingId: payload.result_id, error: "" });
    try {
      const response = await submitInspectionResult(payload, idempotencyKey);
      set({ actingId: null, lastReplayedId: response.replayed ? payload.result_id : null });
      await get().load();
      return response.replayed;
    } catch (error) {
      set({ actingId: null, error: error instanceof Error ? error.message : "巡检结果提交失败" });
      throw error;
    }
  },
  clearError() {
    set({ error: "" });
  }
}));
