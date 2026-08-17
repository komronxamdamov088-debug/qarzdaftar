const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  token?: string;
  body?: unknown;
}

export async function apiFetch<T>(
  path: string,
  { token, body, headers, ...rest }: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, message || response.statusText);
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

// NestJS's default exception filter responds with { statusCode, message, error };
// user-facing exceptions (debts/payments/reminders) additionally set a stable
// `code` (e.g. "DEBT_NOT_PAYABLE") so the frontend can render a localized
// message instead of the backend's Uzbek-only `message` string.
export function extractApiErrorMessage(
  error: unknown,
  fallback: string,
  codeMessages?: Record<string, string>,
): string {
  if (error instanceof ApiError) {
    try {
      const parsed = JSON.parse(error.message) as {
        message?: string | string[];
        code?: string;
      };
      if (codeMessages && parsed.code && codeMessages[parsed.code]) {
        return codeMessages[parsed.code];
      }
      if (Array.isArray(parsed.message)) return parsed.message.join(", ");
      if (typeof parsed.message === "string") return parsed.message;
    } catch {
      // response body wasn't JSON; fall through to the generic fallback
    }
  }
  return fallback;
}
