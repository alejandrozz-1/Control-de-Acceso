import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LanguageIcon from '@mui/icons-material/Language';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import AccountSubpage from './AccountSubpage';
import { localeOptions } from '../../i18n/catalog';
import { useI18n } from '../../i18n/I18nProvider';

export default function Idioma() {
  const { locale, direction, setLocale, t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const selectedLanguage = localeOptions.find((option) => option.code === locale)!;

  async function chooseLanguage(nextLocale: typeof locale) {
    if (nextLocale === locale || saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await setLocale(nextLocale);
      setSaved(true);
    } catch {
      setError(t('No se pudo guardar el idioma. Inténtalo de nuevo.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AccountSubpage title="Idioma" description="Idioma de la aplicación">
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <LanguageIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {t('Idioma actual')}: {selectedLanguage.nativeName}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('Selecciona el idioma que quieres usar en la aplicación.')}
        </Typography>
        {error && <Alert severity="error" role="alert" sx={{ mb: 1.5 }}>{error}</Alert>}
        {saved && <Alert severity="success" role="status" sx={{ mb: 1.5 }}>{t('El idioma se ha actualizado.')}</Alert>}
        {direction === 'rtl' && (
          <Alert severity="info" sx={{ mb: 1.5 }}>{t('Este idioma usa escritura de derecha a izquierda.')}</Alert>
        )}
        <Box sx={{ display: 'grid', gap: 1 }}>
          {localeOptions.map((option) => {
            const selected = locale === option.code;
            return (
              <ButtonBase
                key={option.code}
                onClick={() => void chooseLanguage(option.code)}
                disabled={saving}
                aria-pressed={selected}
                sx={{
                  width: '100%',
                  minHeight: 64,
                  p: 1.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  textAlign: 'start',
                  border: '1px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  borderRadius: 3,
                  bgcolor: selected ? 'action.selected' : 'background.paper',
                  '&:hover': { bgcolor: selected ? 'action.selected' : 'action.hover' },
                  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{option.nativeName}</Typography>
                  <Typography variant="body2" color="text.secondary">{option.name}</Typography>
                </Box>
                {saving && !selected ? (
                  <CircularProgress size={20} aria-label={t('Cargando…')} />
                ) : selected ? (
                  <CheckCircleIcon color="primary" aria-label={t('Idioma seleccionado')} />
                ) : null}
              </ButtonBase>
            );
          })}
        </Box>
      </Paper>
    </AccountSubpage>
  );
}
