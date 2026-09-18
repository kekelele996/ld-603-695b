import { create } from "zustand";
import {
  createHazardTicket,
  listHazardTicket,
  reinspectHazardTicket,
  submitRectification
} from "../api/HazardTicket";
import type { HazardTicket } from "../types/HazardTicket";

type State = {
  rows: HazardTicket[];
  loading: boolean;
  loadingTicketId: number | null;
  load: () => Promise<void>;
  openTicket: (payload: { result_id: number; severity: string; owner_id: number; deadline: string },
               key?: string) => Promise<void>;
  rectify: (ticketId: number, note: string, key?: string) => Promise<void>;
  reinspect: (ticketId: number, passed: boolean, note: string, key?: string) => Promise<void>;
};

export const useHazardTicketStore = create<State>((set) => ({
  rows: [],
  loading: false,
  loadingTicketId: null,
  async load() {
    set({ loading: true });
    set({ rows: await listHazardTicket(), loading: false });
  },
  async openTicket(payload, key) {
    const created = await createHazardTicket(payload, key);
    set((state) => ({
      rows: [created, ...state.rows.filter((row) => row.id !== created.id)]
    }));
  },
  async rectify(ticketId, note, key) {
    set({ loadingTicketId: ticketId });
    try {
      const updated = await submitRectification(ticketId, note, key);
      set((state) => ({ rows: state.rows.map((row) => (row.id === ticketId ? updated : row)) }));
    } finally {
      set({ loadingTicketId: null });
    }
  },
  async reinspect(ticketId, passed, note, key) {
    set({ loadingTicketId: ticketId });
    try {
      const updated = await reinspectHazardTicket(ticketId, passed, note, key);
      set((state) => ({ rows: state.rows.map((row) => (row.id === ticketId ? updated : row)) }));
    } finally {
      set({ loadingTicketId: null });
    }
  }
}));
