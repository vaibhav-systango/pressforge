export async function parseJsonBody<T = any>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function isClientUser(payload: any): payload is any {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.id === 'string' &&
    typeof payload.name === 'string' &&
    typeof payload.email === 'string' &&
    typeof payload.workspaceId === 'string'
  );
}

export function isDraft(payload: any): payload is any {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.id === 'string' &&
    typeof payload.workspaceId === 'string'
  );
}

export function isCampaign(payload: any): payload is any {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.id === 'string' &&
    typeof payload.workspaceId === 'string'
  );
}
