import { create } from "zustand";
import { listInspectionResult, submitInspectionResult } from "../api/InspectionResult";
import type { SubmitResultPayload } from "../api/InspectionResult";
import type { InspectionResult } from "../types/InspectionResult";

type State = {
  rows: InspectionResult[];
  loading: boolean;
  submitting: boolean;
  load: () => Promise<void>;
  submit: (payload: SubmitResultPayload, key?: string) => Promise<unknown>;
};

export const useInspectionResultStore = create<State>((set) => ({
  rows: [],
  loading: false,
  submitting: false,
  async load() {
    set({ loading: true });
    set({ rows: await listInspectionResult(), loading: false });
  },
  async submit(payload, key) {
    set({ submitting: true });
    try {
      const response = await submitInspectionResult(payload, key);
      const created = "result" in response ? response.result : (response as InspectionResult);
      set((state) => ({ rows: [created, ...state.rows] }));
      return response;
    } finally {
      set({ submitting: false });
    }
  }
}));
