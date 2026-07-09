import { useEffect, useState } from 'react';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function useClientSession() {
  const [hasSession, setHasSession] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return !!getCookie('access_token');
  });

  useEffect(() => {
    const checkSession = () => {
      setHasSession(!!getCookie('access_token'));
    };

    // Check periodically or handle focus, etc.
    const interval = setInterval(checkSession, 1000);
    return () => clearInterval(interval);
  }, []);

  return hasSession;
}
