import type { User } from "./types";

let token: string | null = null;
interface Session { accessToken: string; user: User }

function raw(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (typeof init.body === "string" && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(`/api${path}`, { ...init, headers, credentials: "include" });
}

export async function refresh(): Promise<User | null> {
  const r = await raw("/auth/refresh", { method: "POST" });
  if (!r.ok) { token = null; return null; }
  const s = (await r.json()) as Session;
  token = s.accessToken;
  return s.user;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let r = await raw(path, init);
  if (r.status === 401 && !path.startsWith("/auth/") && (await refresh())) r = await raw(path, init);
  if (!r.ok) {
    const e = (await r.json().catch(() => ({}))) as { message?: string | string[] };
    throw new Error(Array.isArray(e.message) ? e.message.join(", ") : (e.message ?? `Erreur ${r.status}`));
  }
  return (await r.json()) as T;
}

export async function signIn(mode: "login" | "register", body: Record<string, string>): Promise<User> {
  const s = await api<Session>(`/auth/${mode}`, { method: "POST", body: JSON.stringify(body) });
  token = s.accessToken;
  return s.user;
}

export async function signOut(): Promise<void> {
  await api("/auth/logout", { method: "POST" }).catch(() => undefined);
  token = null;
}
