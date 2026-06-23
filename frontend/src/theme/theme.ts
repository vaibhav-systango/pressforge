import { createTheme } from '@mantine/core';
import { THEME } from '@/constants';

export const theme = createTheme({
  primaryColor: 'brandViolet',
  colors: {
    brandViolet: THEME.BRAND_VIOLET,
  },
  fontFamily: 'var(--font-sans), Inter, system-ui, sans-serif',
  defaultRadius: 'md',
});
