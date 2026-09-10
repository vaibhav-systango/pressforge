import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-instagram-pink animate-spin" />
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    </div>
  );
}
