import type { CurrentUser } from "../types/CurrentUser";

// 与后端 seed.user 保持一致的演示用户档案
export const DEMO_USERS: CurrentUser[] = [
  { id: 1, name: "张巡检", role: "INSPECTOR" },
  { id: 2, name: "周巡查", role: "INSPECTOR" },
  { id: 3, name: "李维保", role: "MAINTAINER" },
  { id: 4, name: "王主管", role: "SUPERVISOR" },
  { id: 5, name: "赵审计", role: "AUDITOR" }
];

export const ROLE_TEXT: Record<CurrentUser["role"], string> = {
  INSPECTOR: "巡检员",
  MAINTAINER: "维保商",
  SUPERVISOR: "物业主管",
  AUDITOR: "审计员"
};
