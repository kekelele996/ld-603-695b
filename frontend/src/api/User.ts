import { mockData } from "../mocks/seedData";
import { request } from "./client";
import { identityHeaders } from "./session";
import type { User } from "../types/User";

export async function listUser(): Promise<User[]> {
  try {
    return await request<User[]>("/user", { headers: identityHeaders() });
  } catch {
    return [...(mockData.user as unknown as User[])];
  }
}
