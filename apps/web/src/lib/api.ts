const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3333";

export function apiHeaders(token?: string): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function apiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("lifexp_token");
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: { ...apiHeaders(token), ...opts.headers },
  });
}

export async function apiJson<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, opts);
  const txt = await res.text();
  let data: any = txt;
  try { data = JSON.parse(txt); } catch { /* */ }
  if (!res.ok) {
    const err = data?.error ?? { code: "ERROR", message: `Request failed (${res.status})` };
    throw new Error(err.message ?? "Erro na requisição", { cause: err });
  }
  return data;
}
