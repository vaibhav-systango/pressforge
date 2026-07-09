/** Structured error thrown by API response handlers. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Parse a fetch/axios error response and return an ApiError.
 * Works with both the standard { error, code } shape from our API routes
 * and plain status-only errors.
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  try {
    const body = await response.json();
    return new ApiError(
      body.error ?? body.message ?? 'An unexpected error occurred',
      response.status,
      body.code ?? 'UNKNOWN',
    );
  } catch {
    return new ApiError('An unexpected error occurred', response.status, 'UNKNOWN');
  }
}
