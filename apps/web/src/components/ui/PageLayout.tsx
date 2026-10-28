import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

/** Página-base de las secciones (mobile-first). */
export default function PageLayout({
  title,
  phase,
  children,
}: {
  title: string;
  phase: string;
  children?: React.ReactNode;
}) {
  return (
    <Container maxWidth="sm" sx={{ pt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 2 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {phase}
        </Typography>
      </Box>
      {children ?? (
        <Typography color="text.secondary">Contenido pendiente de implementación.</Typography>
      )}
    </Container>
  );
}
