import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';

/** Página-base de las secciones (mobile-first). */
export default function PageLayout({
  title,
  children,
  backTo,
}: {
  title: string;
  children?: React.ReactNode;
  backTo?: string;
}) {
  const { t } = useI18n();

  return (
    <Container maxWidth={backTo ? 'xl' : 'sm'} sx={{ pt: backTo ? { xs: 2, md: 4 } : 3 }}>
      {backTo && (
        <Button
          component={RouterLink}
          to={backTo}
          startIcon={<ArrowBackIcon />}
          color="inherit"
          sx={{ mb: 2, px: 0, minHeight: 40, fontWeight: 600, '&:hover': { bgcolor: 'transparent', color: 'primary.main' } }}
        >
          Volver
        </Button>
      )}
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 2 }}>
        <Typography variant={backTo ? 'h4' : 'h5'} component="h1" sx={{ fontWeight: 700, letterSpacing: backTo ? '-0.03em' : undefined }}>
          {t(title)}
        </Typography>
      </Box>
      {children ?? (
        <Typography color="text.secondary">{t('Contenido pendiente de implementación.')}</Typography>
      )}
    </Container>
  );
}
