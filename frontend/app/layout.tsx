import type { Metadata } from 'next';

import { AppProviders } from '@/providers/app-providers';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'PressForge.AI',
  description: 'Automate your brand PR and social media with AI intelligence.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var mode = (stored === 'light' || stored === 'dark' || stored === 'auto') ? stored : 'auto';
                  var resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode;
                  if (resolved === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                  if (mode !== 'auto') {
                    document.documentElement.setAttribute('data-theme', mode);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
