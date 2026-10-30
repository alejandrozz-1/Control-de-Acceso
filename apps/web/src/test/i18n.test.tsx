import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import { useTheme } from '@mui/material/styles';
import { AppProviders } from '../app/providers';
import { localeOptions, translate } from '../i18n/catalog';
import { useI18n } from '../i18n/I18nProvider';

function LocaleProbe() {
  const { locale, direction, t, setLocale } = useI18n();
  const theme = useTheme();
  return (
    <>
      <output data-testid="locale">{locale}</output>
      <output data-testid="direction">{direction}</output>
      <output data-testid="theme-direction">{theme.direction}</output>
      <output data-testid="home-label">{t('Inicio')}</output>
      <button onClick={() => void setLocale('ar')}>Arabic</button>
      <button onClick={() => void setLocale('en')}>English</button>
    </>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.dir = 'ltr';
  document.documentElement.lang = 'es';
});

test('offers the requested locales and translates the interface', () => {
  expect(localeOptions.map(({ code }) => code)).toEqual([
    'es', 'ca', 'en', 'fr', 'de', 'pt', 'ar', 'no', 'it',
  ]);
  expect(localeOptions.find(({ code }) => code === 'ar')?.nativeName).toBe('العربية');
});

test('translates the requests section at the bottom of the calendar in every locale', () => {
  for (const locale of localeOptions.map(({ code }) => code).filter((code) => code !== 'es')) {
    expect(translate(locale, 'Tus solicitudes')).not.toBe('Tus solicitudes');
    expect(translate(locale, 'Nueva solicitud')).not.toBe('Nueva solicitud');
    expect(translate(locale, 'Pendientes de tu equipo')).not.toBe('Pendientes de tu equipo');
    expect(translate(locale, 'Aún no has solicitado vacaciones ni permisos.'))
      .not.toBe('Aún no has solicitado vacaciones ni permisos.');
  }
  expect(translate('ar', 'día')).toBe('يوم');
  expect(translate('ar', 'días')).toBe('أيام');
});

test('switches Arabic to RTL and restores LTR when changing back', async () => {
  render(
    <AppProviders>
      <LocaleProbe />
    </AppProviders>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Arabic' }));
  await waitFor(() => {
    expect(screen.getByTestId('locale')).toHaveTextContent('ar');
    expect(screen.getByTestId('direction')).toHaveTextContent('rtl');
    expect(screen.getByTestId('theme-direction')).toHaveTextContent('rtl');
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByTestId('home-label')).toHaveTextContent('الرئيسية');
  });
  expect(window.localStorage.getItem('rps-locale')).toBe('ar');

  fireEvent.click(screen.getByRole('button', { name: 'English' }));
  await waitFor(() => {
    expect(document.documentElement.dir).toBe('ltr');
    expect(screen.getByTestId('home-label')).toHaveTextContent('Home');
  });
});
