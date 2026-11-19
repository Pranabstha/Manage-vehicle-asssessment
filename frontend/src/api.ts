export interface ApiError {
  failed: true;
  message: string;
  errors?: Record<string, string[]>;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (res.status === 204) return undefined as T;
  // nginx answers with an HTML page when the backend is down, so the body may not be JSON.
  const body = await res.json().catch(() => null);
  if (!res.ok) throw body ?? { failed: true, message: "Could not reach the server." };
  return body as T;
}
