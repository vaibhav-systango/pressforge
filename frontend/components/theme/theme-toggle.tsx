'use client';

import { useEffect, useState } from 'react';
import { Laptop, Moon, Sun } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'auto';

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'auto';
  }

  const stored = window.localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored;
  }

  return 'auto';
}

function applyThemeMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode;

  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(resolved);

  if (mode === 'auto') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', mode);
  }

  document.documentElement.style.colorScheme = resolved;
}

interface ThemeToggleProps {
  hidden?: boolean;
}

export function ThemeToggle({ hidden }: ThemeToggleProps) {
  const [mode, setMode] = useState<ThemeMode>(() =>
    typeof window === 'undefined' ? 'auto' : getInitialMode(),
  );

  useEffect(() => {
    applyThemeMode(mode);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (getInitialMode() === 'auto') {
        applyThemeMode('auto');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  const cycleMode = () => {
    const next: ThemeMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light';
    setMode(next);
    window.localStorage.setItem('theme', next);
    applyThemeMode(next);
  };

  if (hidden) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={cycleMode}
      title={`Theme: ${mode}`}
      className="p-1.5 rounded-lg hover:bg-bg-hover text-text-secondary hover:text-text-primary transition duration-150"
    >
      {mode === 'light' && <Sun className="w-4 h-4" />}
      {mode === 'dark' && <Moon className="w-4 h-4" />}
      {mode === 'auto' && <Laptop className="w-4 h-4" />}
    </button>
  );
}
