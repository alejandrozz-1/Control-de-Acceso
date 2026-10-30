import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useI18n } from '../../i18n/I18nProvider';

/** Página-base de las secciones (mobile-first). */
export default function PageLayout({
  title,
  phase,
  children,
}: {
  title: string;
  phase?: string;
  children?: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <Container maxWidth="sm" sx={{ pt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 2 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
          {t(title)}
        </Typography>
        {phase && (
          <Typography variant="caption" color="text.secondary">
            {t(phase)}
          </Typography>
        )}
      </Box>
      {children ?? (
        <Typography color="text.secondary">{t('Contenido pendiente de implementación.')}</Typography>
      )}
    </Container>
  );
}
