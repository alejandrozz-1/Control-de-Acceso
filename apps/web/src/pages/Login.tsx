import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { brand } from '../app/theme';
import RepsolFlame from '../components/ui/RepsolFlame';
import { useAuthStore } from '../services/auth';

export default function Login() {
  const { session, initializing, signIn } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!initializing && session) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={0} sx={{ width: '100%', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        {/* Cabecera de marca estilo Waylet */}
        <Box
          sx={{
            background: brand.gradient,
            color: brand.white,
            px: 4,
            pt: 3,
            pb: 5,
            borderRadius: '0 0 28px 28px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'absolute', top: -16, right: -10, opacity: 0.2, pointerEvents: 'none' }}>
            <RepsolFlame size={120} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative' }}>
            <RepsolFlame size={36} />
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.9, letterSpacing: 2, textTransform: 'uppercase', display: 'block', lineHeight: 1.2 }}>
                Repsol
              </Typography>
              <Typography variant="h6" component="h1" sx={{ fontWeight: 800, lineHeight: 1.1, fontSize: '1.1rem' }}>
                Control de Acceso
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 4, pt: 3.5 }}>
          <Typography variant="body2" color="text.secondary">
            Inicia sesión con tu cuenta corporativa
          </Typography>
          {error && (
            <Alert severity="error" role="alert">
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              fullWidth
            />
            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={busy} fullWidth>
              {busy ? 'Entrando…' : 'Entrar'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
