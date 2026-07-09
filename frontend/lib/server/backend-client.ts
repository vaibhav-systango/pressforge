interface CallBackendResult<T> {
  data: T | null;
  errorMessage: string | null;
  response: Response;
}

export async function callBackend<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
    accessToken?: string;
  } = {}
): Promise<CallBackendResult<T>> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
  const url = `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (options.accessToken) {
    headers['Authorization'] = `Bearer ${options.accessToken}`;
  }

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body,
    });

    if (!response.ok) {
      let errorMsg = 'Backend request failed';
      try {
        const errJson = await response.json();
        errorMsg = errJson.detail || errJson.message || errorMsg;
      } catch {
        // ignore
      }
      return {
        data: null,
        errorMessage: errorMsg,
        response,
      };
    }

    const data = (await response.json()) as T;
    return {
      data,
      errorMessage: null,
      response,
    };
  } catch (err: any) {
    const dummyResponse = new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      statusText: 'Internal Server Error',
    });
    return {
      data: null,
      errorMessage: err.message || 'Fetch error',
      response: dummyResponse,
    };
  }
}
