'use client';

import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';

interface ThemeToggleProps {
  hidden?: boolean;
}

export function ThemeToggle({ hidden }: ThemeToggleProps) {
  const { mode, cycleMode } = useTheme();

  if (hidden) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={cycleMode}
      title={`Theme mode: ${mode}`}
      aria-label={`Toggle theme (currently ${mode})`}
      className="p-1.5 rounded-lg hover:bg-bg-hover text-text-secondary hover:text-text-primary transition duration-150 cursor-pointer"
    >
      {mode === 'light' && <Sun className="w-4 h-4" />}
      {mode === 'dark' && <Moon className="w-4 h-4" />}
      {mode === 'auto' && <Laptop className="w-4 h-4" />}
    </button>
  );
}
