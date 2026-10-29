import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import AccountSubpage from './AccountSubpage';

const helpItems = [
  {
    question: '¿Cómo muestro mi credencial de acceso?',
    answer: (
      <>
        Abre la sección <Link component={RouterLink} to="/acceso">Acceso</Link> para generar tu QR. El código tiene una validez breve y necesita conexión para verificarse.
      </>
    ),
  },
  {
    question: '¿Dónde puedo consultar mis turnos?',
    answer: (
      <>
        Consulta el <Link component={RouterLink} to="/calendario">Calendario</Link> para ver los turnos, festivos, eventos y solicitudes asociados a tu cuenta.
      </>
    ),
  },
  {
    question: '¿Cómo reviso mis avisos?',
    answer: (
      <>
        En <Link component={RouterLink} to="/notificaciones">Notificaciones</Link> puedes consultar los avisos y marcar los que ya has leído.
      </>
    ),
  },
  {
    question: '¿Cómo cambio mi contraseña?',
    answer: (
      <>
        Ve a <Link component={RouterLink} to="/cuenta/seguridad">Seguridad</Link>. Se te pedirá la contraseña actual antes de aplicar una nueva.
      </>
    ),
  },
];

export default function Ayuda() {
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
