'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useMounted } from '@/lib/hooks/use-mounted';
import './globals.css';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const mounted = useMounted();

  useEffect(() => {
    console.error('Fatal Layout Error:', error);
  }, [error]);

  if (!mounted) return null;

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080C14] text-[#F3F4F6] font-sans antialiased overflow-x-hidden">
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#080C14] select-none">
          {/* Decorative Glow Blobs */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] rounded-full bg-red-500/5 blur-[100px]" />
            <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] rounded-full bg-amber-500/5 blur-[100px]" />
          </div>

          {/* Main Content Area */}
          <main className="max-w-md w-full z-10 text-center space-y-6">
            <div className="space-y-2">
              <span className="text-sm font-semibold tracking-wider text-red-500 uppercase">
                Fatal Error
              </span>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                System failure occurred
              </h1>
              <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                The application core failed to initialize. Try resetting the session.
              </p>
              {error.digest && (
                <p className="text-[11px] font-mono text-slate-500 pt-1">
                  Error ID: <span className="text-slate-300">{error.digest}</span>
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
                className="w-full sm:w-auto px-5 py-2 text-sm border-slate-800 backdrop-blur-sm bg-white/5 hover:bg-white/10 text-white hover:scale-[1.01] transition-transform"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/app';
                  }
                }}
              >
                Go to Dashboard
              </Button>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
