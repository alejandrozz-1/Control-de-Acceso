import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from './theme';
import { I18nProvider, useI18n } from '../i18n/I18nProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <DirectionProviders>
        {children}
      </DirectionProviders>
    </I18nProvider>
  );
}

function DirectionProviders({ children }: { children: ReactNode }) {
  const { direction } = useI18n();
  const theme = useMemo(() => createAppTheme(direction), [direction]);
  const cache = useMemo(
    () => createCache({
      key: direction === 'rtl' ? 'muirtl' : 'mui',
      stylisPlugins: direction === 'rtl' ? [prefixer, rtlPlugin] : [],
    }),
    [direction],
  );

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme} defaultMode="light" modeStorageKey="rps-color-scheme">
        <CssBaseline />
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}
