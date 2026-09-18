import { create } from "zustand";
import { listHazardTicket, reviewHazardTicket, submitRectify } from "../api/HazardTicket";
import type { HazardTicket } from "../types/HazardTicket";

type State = {
  rows: HazardTicket[];
  loading: boolean;
  actingId: number | null;
  error: string;
  load: (status?: string) => Promise<void>;
  rectify: (ticketId: number, note: string) => Promise<void>;
  review: (ticketId: number, approved: boolean, note: string) => Promise<void>;
  clearError: () => void;
};

export const useHazardTicketStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  actingId: null,
  error: "",
  async load(status = "") {
    set({ loading: true, error: "" });
    try {
      set({ rows: await listHazardTicket(status), loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "隐患单加载失败" });
    }
  },
  async rectify(ticketId, note) {
    set({ actingId: ticketId, error: "" });
    try {
      await submitRectify(ticketId, note);
      set({ actingId: null });
      await get().load();
    } catch (error) {
      set({ actingId: null, error: error instanceof Error ? error.message : "整改提交失败" });
      throw error;
    }
  },
  async review(ticketId, approved, note) {
    set({ actingId: ticketId, error: "" });
    try {
      await reviewHazardTicket(ticketId, approved, note);
      set({ actingId: null });
      await get().load();
    } catch (error) {
      set({ actingId: null, error: error instanceof Error ? error.message : "复验失败" });
      throw error;
    }
  },
  clearError() {
    set({ error: "" });
  }
}));
