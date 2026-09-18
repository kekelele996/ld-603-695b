// 统一请求封装：默认带上当前登录用户身份头；写操作自动携带幂等键。
// 前端代码统一请求 /api，禁止硬编码 localhost。

export type ApiError = { code: string; message: string; status: number };

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    // headers 必须最后合并，否则 options.headers 会整体覆盖默认的 Content-Type
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) }
  });
  if (!res.ok) {
    let body: { code?: string; message?: string } = {};
    try {
      body = await res.json();
    } catch {
      // 非 JSON 错误响应
    }
    const error: ApiError = {
      code: body.code ?? "HTTP_ERROR",
      message: body.message ?? res.statusText,
      status: res.status
    };
    throw error;
  }
  return res.json() as Promise<T>;
}

export function idempotencyKey(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
