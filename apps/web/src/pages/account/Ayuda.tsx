import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import AccountSubpage from './AccountSubpage';
import { useI18n } from '../../i18n/I18nProvider';

function getHelpItems(t: (key: string) => string) {
  return [
  {
    question: t('¿Cómo muestro mi credencial de acceso?'),
    answer: (
      <>
        {t('Abre la sección')} <Link component={RouterLink} to="/acceso">{t('Acceso')}</Link> {t('para generar tu QR. El código tiene una validez breve y necesita conexión para verificarse.')}
      </>
    ),
  },
  {
    question: t('¿Dónde puedo consultar mis turnos?'),
    answer: (
      <>
        {t('Consulta el')} <Link component={RouterLink} to="/calendario">{t('Calendario')}</Link> {t('para ver los turnos, festivos, eventos y solicitudes asociados a tu cuenta.')}
      </>
    ),
  },
  {
    question: t('¿Cómo reviso mis avisos?'),
    answer: (
      <>
        {t('En')} <Link component={RouterLink} to="/notificaciones">{t('Notificaciones')}</Link> {t('puedes consultar los avisos y marcar los que ya has leído.')}
      </>
    ),
  },
  {
    question: t('¿Cómo cambio mi contraseña?'),
    answer: (
      <>
        {t('Ve a')} <Link component={RouterLink} to="/cuenta/seguridad">{t('Seguridad')}</Link>. {t('Se te pedirá la contraseña actual antes de aplicar una nueva.')}
      </>
    ),
  },
  ];
}

export default function Ayuda() {
  const { t } = useI18n();
  const helpItems = getHelpItems(t);

  return (
    <AccountSubpage title="Ayuda" description="Guía rápida de la aplicación">
      <Paper variant="outlined" sx={{ p: 1, borderRadius: 4 }}>
        {helpItems.map(({ question, answer }) => (
          <Accordion key={question} disableGutters elevation={0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 56 }}>
              <Typography sx={{ fontWeight: 600 }}>{question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">{answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </AccountSubpage>
  );
}
