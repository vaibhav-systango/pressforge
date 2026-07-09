const API_BASE_URL =
  process.env.BACKEND_API_URL?.replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:8000/api/v1';

function parseBackendErrorBody(body: unknown): string {
  if (!body || typeof body !== 'object') {
    return 'An unexpected error occurred';
  }

  const detail = (body as { detail?: unknown }).detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (first && typeof first === 'object' && 'msg' in first) {
      return String((first as { msg: string }).msg);
    }
  }

  return 'An unexpected error occurred';
}

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function callBackend<T>(
  path: string,
  init: RequestInit & { accessToken?: string } = {},
): Promise<{ data: T | null; response: Response; errorMessage?: string }> {
  const { accessToken, ...rest } = init;
  const headers = new Headers(rest.headers);

  if (rest.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...rest,
    headers,
  });

  if (!response.ok) {
    const body = await parseJsonResponse<unknown>(response);
    return {
      data: null,
      response,
      errorMessage: body ? parseBackendErrorBody(body) : `Backend request failed (${response.status})`,
    };
  }

  const data = await parseJsonResponse<T>(response);
  if (!data) {
    return {
      data: null,
      response,
      errorMessage: `Backend returned non-JSON from ${url}. Check NEXT_PUBLIC_API_BASE_URL (expected http://localhost:8000/api/v1).`,
    };
  }

  return { data, response };
}
