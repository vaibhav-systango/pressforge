import React from 'react';
import { DashboardScreen } from '@/features/dashboard/components/DashboardScreen';

export default function DashboardPage() {
  return (
    <main className="flex-1 flex flex-col bg-white dark:bg-zinc-950 text-black dark:text-white">
      <DashboardScreen />
    </main>
  );
}
