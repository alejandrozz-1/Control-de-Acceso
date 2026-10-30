import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuthStore } from '../services/auth';
import { supabase } from '../services/supabase';
import { isLocale, translate, type Locale } from './catalog';

const STORAGE_KEY = 'rps-locale';

interface I18nContextValue {
  locale: Locale;
  direction: 'ltr' | 'rtl';
  t: (key: string) => string;
  setLocale: (locale: Locale) => Promise<void>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getStoredLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : 'es';
  } catch {
    return 'es';
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);
  const profile = useAuthStore((state) => state.profile);
  const profileLoaded = useAuthStore((state) => state.profileLoaded);
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [direction, locale]);

  useEffect(() => {
    if (profileLoaded && isLocale(profile?.locale)) {
      setLocaleState(profile.locale);
    }
  }, [profile?.locale, profileLoaded]);

  const setLocale = useCallback(async (nextLocale: Locale) => {
    const currentProfile = useAuthStore.getState().profile;
    if (currentProfile && currentProfile.locale !== nextLocale) {
      const { error } = await supabase
        .from('profiles')
        .update({ locale: nextLocale })
        .eq('id', currentProfile.id);
      if (error) throw error;
      useAuthStore.getState().setProfile({ ...currentProfile, locale: nextLocale });
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, nextLocale);
    } catch (error) {
      if (!currentProfile) {
        throw new Error('No se pudo guardar la preferencia de idioma en este dispositivo.', { cause: error });
      }
    }
    setLocaleState(nextLocale);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, direction, t: (key) => translate(locale, key), setLocale }),
    [direction, locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n debe utilizarse dentro de I18nProvider');
  return value;
}
