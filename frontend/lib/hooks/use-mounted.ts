'use client';

import { useSyncExternalStore } from 'react';

function subscribe() {
  return () => {};
}

/** Returns true only after the component has mounted on the client. */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
