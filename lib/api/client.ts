const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

/**
 * The access token is deliberately a module variable and never touches
 * localStorage: anything persisted there is readable by any script that gets
 * injected into the panel. It dies with the tab and is rebuilt on load from the
 * httpOnly refresh cookie, which scripts cannot read at all.
 */
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static async from(res: Response) {
    let message = res.statusText || `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message.join(", ");
      else if (body.message) message = body.message;
    } catch {
      // Not every error response carries a JSON body; the status text stands.
    }
    return new ApiError(res.status, message);
  }
}

/**
 * One refresh at a time. Without this, a screen firing five queries that all
 * meet an expired token would fire five refreshes — and since every refresh
 * rotates the cookie, the losers would be replaying a token the server has
 * already retired.
 */
let refreshInFlight: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        // Sends the httpOnly refresh cookie. Requires the API to list this
        // origin in ADMIN_ORIGINS, or the browser drops the response.
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken: string };
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

type Query = Record<string, string | number | boolean | undefined | null>;

export interface ApiInit extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Query;
  /** Skip the 401 retry — used by the auth calls themselves. */
  skipRefresh?: boolean;
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${API_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function send(path: string, init: ApiInit, token: string | null) {
  const isFormData = init.body instanceof FormData;
  const headers = new Headers(init.headers);
  // Let the browser set multipart boundaries itself; forcing a Content-Type
  // here would corrupt the upload.
  if (!isFormData && init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(buildUrl(path, init.query), {
    ...init,
    headers,
    credentials: "include",
    body: isFormData
      ? (init.body as FormData)
      : init.body !== undefined
        ? JSON.stringify(init.body)
        : undefined,
  });
}

export async function apiFetch<T>(
  path: string,
  init: ApiInit = {},
): Promise<T> {
  let res = await send(path, init, accessToken);

  // An access token only lives 15 minutes, so a 401 mid-session is routine
  // rather than exceptional: refresh once and replay the request.
  if (res.status === 401 && !init.skipRefresh) {
    const renewed = await refreshAccessToken();
    if (renewed) res = await send(path, init, renewed);
  }

  if (!res.ok) throw await ApiError.from(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => apiFetch<T>(path, { query }),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
