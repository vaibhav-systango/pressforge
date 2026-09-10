'use client';

import { Skeleton } from '@/components/common/skeleton';

export function WorkspacesSkeleton() {
  return (
    <div className="flex flex-col gap-6 text-text-primary animate-fade-in">
      {/* Header Skeleton */}
      <div className="border-b border-border-primary pb-5 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56 bg-slate-200/40 dark:bg-slate-800/40" />
          <Skeleton className="h-4 w-96 mt-1 bg-slate-200/40 dark:bg-slate-800/40" />
        </div>
        <Skeleton className="h-9 w-32 shrink-0 bg-slate-200/40 dark:bg-slate-800/40" />
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Workspace Selector */}
        <div className="lg:col-span-3 bg-bg-card border border-border-primary rounded-2xl p-4 shadow-sm space-y-4">
          <Skeleton className="h-4 w-28 bg-slate-200/40 dark:bg-slate-800/40" />
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border-primary/50">
                <Skeleton className="w-7 h-7 rounded-full shrink-0 bg-slate-200/40 dark:bg-slate-800/40" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4 bg-slate-200/40 dark:bg-slate-800/40" />
                  <Skeleton className="h-2 w-1/2 bg-slate-200/40 dark:bg-slate-800/40" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Edit Panel */}
        <div className="lg:col-span-9 space-y-6">
          {/* Profile banner */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-10 h-10 rounded-full shrink-0 bg-slate-200/40 dark:bg-slate-800/40" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-48 bg-slate-200/40 dark:bg-slate-800/40" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 bg-slate-200/40 dark:bg-slate-800/40" />
              <Skeleton className="h-8 w-24 bg-slate-200/40 dark:bg-slate-800/40" />
            </div>
          </div>

          {/* Properties form */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-6">
            <Skeleton className="h-5 w-48 border-b border-border-primary/50 pb-2 bg-slate-200/40 dark:bg-slate-800/40" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Form Column */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-32 bg-slate-200/40 dark:bg-slate-800/40" />
                  <Skeleton className="h-9 w-full bg-slate-200/40 dark:bg-slate-800/40" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-32 bg-slate-200/40 dark:bg-slate-800/40" />
                  <Skeleton className="h-9 w-full bg-slate-200/40 dark:bg-slate-800/40" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-32 bg-slate-200/40 dark:bg-slate-800/40" />
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <Skeleton key={idx} className="h-12 w-full bg-slate-200/40 dark:bg-slate-800/40" />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-44 bg-slate-200/40 dark:bg-slate-800/40" />
                  <Skeleton className="h-24 w-full bg-slate-200/40 dark:bg-slate-800/40" />
                </div>
              </div>

              {/* Right Form Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28 bg-slate-200/40 dark:bg-slate-800/40" />
                  <Skeleton className="h-9 w-full bg-slate-200/40 dark:bg-slate-800/40" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-6 w-16 rounded-full bg-slate-200/40 dark:bg-slate-800/40" />
                    <Skeleton className="h-6 w-16 rounded-full bg-slate-200/40 dark:bg-slate-800/40" />
                  </div>
                </div>
                <div className="space-y-2 pt-4 border-t border-border-primary/50">
                  <Skeleton className="h-3 w-36 bg-slate-200/40 dark:bg-slate-800/40" />
                  <Skeleton className="h-9 w-full bg-slate-200/40 dark:bg-slate-800/40" />
                  <div className="space-y-2 mt-3">
                    <Skeleton className="h-8 w-full bg-slate-200/40 dark:bg-slate-800/40" />
                    <Skeleton className="h-8 w-full bg-slate-200/40 dark:bg-slate-800/40" />
                  </div>
                </div>
              </div>
            </div>

            {/* Save button skeleton */}
            <Skeleton className="h-10 w-full mt-6 bg-slate-200/40 dark:bg-slate-800/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
