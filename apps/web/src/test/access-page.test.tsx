import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Acceso from '../pages/Acceso';
import { I18nProvider } from '../i18n/I18nProvider';
import { createAppTheme } from '../app/theme';
import { issueQr, issueTemporal } from '../services/access';

vi.mock('../services/access', () => ({
  formatCountdown: (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
  issueQr: vi.fn(),
  issueTemporal: vi.fn(),
  secondsUntil: (expiresAt: string, now = Date.now()) =>
    Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000)),
}));

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,test') },
}));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function renderAcceso() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider theme={createAppTheme()}>
          <MemoryRouter>
            <Acceso />
          </MemoryRouter>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>,
  );
}

test('el QR caducado requiere regeneración manual', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-04T10:00:00Z'));
  vi.mocked(issueQr).mockResolvedValue({
    kind: 'qr',
    payload: 'signed-payload',
    credential_id: 'credential-1',
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  });

  renderAcceso();
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  expect(issueQr).toHaveBeenCalledTimes(1);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000);
  });
  expect(screen.getByText('Caducada')).toBeInTheDocument();
  expect(issueQr).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole('button', { name: 'Regenerar código QR' }));
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  expect(issueQr).toHaveBeenCalledTimes(2);
});

test('el código temporal caducado solo se regenera al pulsar el botón', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-04T10:00:00Z'));
  vi.mocked(issueQr).mockResolvedValue({
    kind: 'qr',
    payload: 'signed-payload',
    credential_id: 'credential-1',
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  });
  vi.mocked(issueTemporal).mockResolvedValue({
    kind: 'temporal',
    code: '02341069',
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  });

  renderAcceso();
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  fireEvent.click(screen.getByRole('button', { name: 'Usar código temporal' }));
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  expect(screen.getByText('02341069')).toBeInTheDocument();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000);
  });
  expect(screen.getByRole('button', { name: 'Regenerar código temporal' })).toBeInTheDocument();
  expect(issueTemporal).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole('button', { name: 'Regenerar código temporal' }));
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  expect(issueTemporal).toHaveBeenCalledTimes(2);
});
