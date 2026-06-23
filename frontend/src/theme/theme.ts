import { createTheme, MantineColorsTuple } from '@mantine/core';

// A premium violet brand palette
const brandViolet: MantineColorsTuple = [
  '#f5f3ff',
  '#ede9fe',
  '#ddd6fe',
  '#c084fc',
  '#a855f7',
  '#9333ea',
  '#7c3aed',
  '#6d28d9',
  '#5b21b6',
  '#4c1d95',
];

export const theme = createTheme({
  primaryColor: 'brandViolet',
  colors: {
    brandViolet,
  },
  fontFamily: 'var(--font-sans), Inter, system-ui, sans-serif',
  defaultRadius: 'md',
});
