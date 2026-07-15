'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw, Home } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.error('Application Runtime Error:', error);
  }, [error]);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-bg-app select-none">
      {/* Decorative Glow Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] rounded-full bg-red-500/5 blur-[100px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] rounded-full bg-amber-500/5 blur-[100px]" />
      </div>

      {/* Main Content Area */}
      <main className="max-w-md w-full z-10 text-center space-y-6 animate-fade-in">
        <div className="space-y-2">
          <span className="text-sm font-semibold tracking-wider text-red-500 uppercase">
            500 Error
          </span>
          <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">
            Something went wrong
          </h1>
          <p className="text-text-secondary text-sm max-w-sm mx-auto leading-relaxed">
            An unexpected error occurred in the application. Our systems have logged this incident.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-text-secondary pt-1">
              Error ID: <span className="text-text-primary">{error.digest}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button
            variant="primary"
            className="w-full sm:w-auto px-5 py-2 text-sm shadow-sm hover:scale-[1.01] transition-transform"
            onClick={() => reset()}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Try Again
          </Button>

          <Button
            variant="secondary"
            className="w-full sm:w-auto px-5 py-2 text-sm border-border-primary hover:scale-[1.01] transition-transform"
            onClick={() => router.push('/app')}
          >
            <Home className="w-4 h-4 mr-1" />
            Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
