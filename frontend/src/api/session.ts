// 当前登录身份：由 useAuthStore 写入，api 层读取，避免 store 与 api 循环依赖。
export type Identity = { userId: number; role: string };

let identity: Identity = { userId: 1, role: "INSPECTOR" };

export function setIdentity(next: Identity) {
  identity = next;
}

export function getIdentity(): Identity {
  return identity;
}

export function identityHeaders(extra: HeadersInit = {}): HeadersInit {
  return { "x-user-id": String(identity.userId), "x-role": identity.role, ...extra };
}
