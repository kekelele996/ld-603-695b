import { create } from "zustand";
import { DEMO_USERS } from "../constants/users";
import { getCurrentUserId, setCurrentUserId } from "../api/client";
import type { CurrentUser } from "../types/CurrentUser";

type UserState = {
  user: CurrentUser;
  switchUser: (id: number) => void;
};

const resolveUser = (id: number): CurrentUser =>
  DEMO_USERS.find((item) => item.id === id) ?? DEMO_USERS[0];

export const useCurrentUserStore = create<UserState>((set) => ({
  user: resolveUser(getCurrentUserId()),
  switchUser(id) {
    setCurrentUserId(id);
    set({ user: resolveUser(id) });
  }
}));

// 跨标签/模块同步当前用户
if (typeof window !== "undefined") {
  window.addEventListener("fire-inspect:user-changed", () => {
    useCurrentUserStore.setState({ user: resolveUser(getCurrentUserId()) });
  });
}
