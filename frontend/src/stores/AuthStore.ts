import { create } from "zustand";
import { listUser } from "../api/User";
import { setIdentity } from "../api/session";
import type { User } from "../types/User";

type AuthState = {
  users: User[];
  current: User;
  loadUsers: () => Promise<void>;
  switchUser: (userId: number) => void;
};

const FALLBACK: User = { id: 1, name: "张巡", role: "INSPECTOR" };

export const useAuthStore = create<AuthState>((set, get) => ({
  users: [],
  current: FALLBACK,
  async loadUsers() {
    const users = await listUser();
    const current = get().current;
    set({ users, current: users.find((u) => u.id === current.id) ?? users[0] ?? FALLBACK });
    setIdentity({ userId: get().current.id, role: get().current.role });
  },
  switchUser(userId: number) {
    const user = get().users.find((u) => u.id === userId) ?? get().current;
    setIdentity({ userId: user.id, role: user.role });
    set({ current: user });
  }
}));
