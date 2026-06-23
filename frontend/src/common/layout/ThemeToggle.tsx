'use client';

import React, { useEffect, useState } from 'react';
import { useMantineColorScheme, ActionIcon, ActionIconProps } from '@mantine/core';
import { SunIcon } from '@/assets/svg/SunIcon';
import { MoonIcon } from '@/assets/svg/MoonIcon';

export function ThemeToggle({ className, ...props }: ActionIconProps) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Synchronize document.documentElement class list with colorScheme
  useEffect(() => {
    if (colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [colorScheme]);

  const isDark = colorScheme === 'dark';

  const toggle = () => {
    const nextScheme = isDark ? 'light' : 'dark';
    setColorScheme(nextScheme);
  };

  if (!mounted) {
    return (
      <ActionIcon
        variant="subtle"
        className={`${className || ''} text-foreground/50`}
        size="lg"
        color="gray"
        disabled
        {...props}
      >
        <div className="h-4.5 w-4.5" />
      </ActionIcon>
    );
  }

  return (
    <ActionIcon
      variant="subtle"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`${className || ''} text-foreground hover:bg-foreground/5`}
      size="lg"
      color="gray"
      {...props}
    >
      {isDark ? <SunIcon className="h-[18px] w-[18px] text-yellow-500" /> : <MoonIcon className="h-[18px] w-[18px] text-indigo-600" />}
    </ActionIcon>
  );
}

export default ThemeToggle;
