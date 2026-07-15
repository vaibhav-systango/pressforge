'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function NotFound() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-bg-app select-none">
      {/* Decorative Interactive Background Blobs (Slightly reduced blur/gradient) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] rounded-full bg-[#DD2A7B]/5 blur-[100px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] rounded-full bg-[#515BD4]/5 blur-[100px]" />
      </div>

      {/* Main Content Area */}
      <main className="max-w-md w-full z-10 text-center space-y-6 animate-fade-in">
        <div className="space-y-2">
          <span className="text-sm font-semibold tracking-wider text-[#DD2A7B] uppercase">
            404 Error
          </span>
          <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">
            Page not found
          </h1>
          <p className="text-text-secondary text-sm max-w-sm mx-auto leading-relaxed">
            The page you are looking for doesn't exist or has been moved to another coordinate.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button
            variant="primary"
            className="w-full sm:w-auto px-5 py-2 text-sm shadow-sm hover:scale-[1.01] transition-transform"
            onClick={() => router.push('/app')}
          >
            <Home className="w-4 h-4 mr-1" />
            Dashboard
          </Button>

          <Button
            variant="secondary"
            className="w-full sm:w-auto px-5 py-2 text-sm border-border-primary hover:scale-[1.01] transition-transform"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Go Back
          </Button>
        </div>
      </main>
    </div>
  );
}
