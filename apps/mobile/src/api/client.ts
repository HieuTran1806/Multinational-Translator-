export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
  }

  get isNetwork(): boolean {
    return this.status === 0;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Small JSON client with timeout and uniform error mapping (backend ApiError shape). */
export function createApiClient(getBaseUrl: () => string, fetchImpl: FetchLike = fetch, timeoutMs = 15000) {
  async function getJson<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetchImpl(`${getBaseUrl()}${path}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } catch {
      throw new ApiRequestError('NETWORK_ERROR', 'Network request failed', 0);
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      let code = `HTTP_${res.status}`;
      let message = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        if (body && typeof body.code === 'string') {
          code = body.code;
          message = body.message ?? message;
        }
      } catch {
        // non-JSON error body
      }
      throw new ApiRequestError(code, message, res.status);
    }
    return (await res.json()) as T;
  }

  function absoluteUrl(relative: string): string {
    return /^https?:\/\//i.test(relative) ? relative : `${getBaseUrl()}${relative}`;
  }

  return { getJson, absoluteUrl };
}

export type ApiClient = ReturnType<typeof createApiClient>;
