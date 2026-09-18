import { ERROR_MESSAGES } from "../constants/errorMessages";

const USER_STORAGE_KEY = "fire-inspect:user-id";
const DEFAULT_USER_ID = 1;

export function getCurrentUserId(): number {
  const raw = window.localStorage.getItem(USER_STORAGE_KEY);
  const id = Number(raw ?? DEFAULT_USER_ID);
  return Number.isFinite(id) && id > 0 ? id : DEFAULT_USER_ID;
}

export function setCurrentUserId(id: number) {
  window.localStorage.setItem(USER_STORAGE_KEY, String(id));
  window.dispatchEvent(new Event("fire-inspect:user-changed"));
}

export class ApiBusinessError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, fallbackMessage?: string) {
    super(ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] ?? fallbackMessage ?? "请求失败");
    this.code = code;
    this.status = status;
  }
}

export async function requestJson<T>(input: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-User-Id": String(getCurrentUserId()),
    ...((init.headers as Record<string, string>) ?? {})
  };
  const res = await fetch(input, { ...init, headers });
  if (!res.ok) {
    let code = "VALIDATION_FAILED";
    let fallback = "";
    try {
      const body = await res.json();
      code = body?.detail?.code ?? body?.code ?? code;
      fallback = body?.detail?.message ?? body?.message ?? "";
    } catch {
      // 非 JSON 错误体使用兜底文案
    }
    throw new ApiBusinessError(code, res.status, fallback);
  }
  return (await res.json()) as T;
}
