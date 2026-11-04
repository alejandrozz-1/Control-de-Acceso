import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/auth';
import { adminUsersRequest } from '../services/adminUsers';
import { checkPasswordPolicy } from './account/passwordPolicy';

const errorMessages: Record<string, string> = {
  codigo_o_cuenta_invalida: 'La cuenta no requiere activación o el código no es válido.',
  contrasenas_no_coinciden: 'Las contraseñas no coinciden.',
  contrasena_no_cumple_politica: 'La contraseña no cumple los requisitos.',
  codigo_invalido_o_caducado: 'El código no es válido o ha caducado. Pide al administrador que reenvíe la activación.',
  codigo_temporalmente_bloqueado: 'Has superado el número de intentos. Espera 15 minutos antes de volver a intentarlo.',
};

export default function Activation() {
  const { profile, profileLoaded, session } = useAuthStore();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (profileLoaded && !profile?.must_change_password) return <Navigate to="/" replace />;

  const policy = checkPasswordPolicy(password, {
    full_name: profile?.full_name ?? '',
    email: profile?.email ?? session?.user.email ?? null,
    employee_code: profile?.employee_code ?? null,
  });
  const policyPassed = Object.values(policy).every(Boolean);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await adminUsersRequest({
        action: 'complete-activation',
        code: code.trim(),
        password,
        confirm_password: confirmation,
      });
      if (!profile) throw new Error('No se pudo cargar el perfil de usuario.');
      useAuthStore.getState().setProfile({
        ...profile,
        must_change_password: false,
        status: profile.status === 'pendiente_activacion' ? 'activo' : profile.status,
      });
      navigate('/', { replace: true });
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : '';
      setError(errorMessages[code] ?? (code || 'No se pudo completar la activación.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: { xs: 5, md: 10 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          Activa tu cuenta
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Introduce el código del correo y define una contraseña nueva para continuar.
        </Typography>
        {error && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Código de activación"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'one-time-code', pattern: '\\d{6}', maxLength: 6 } }}
            required
            fullWidth
          />
          <TextField
            label="Nueva contraseña"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
            fullWidth
          />
          <TextField
            label="Confirmar contraseña"
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            required
            fullWidth
          />
          <Box component="ul" sx={{ m: 0, pl: 2.5, color: 'text.secondary', typography: 'caption' }}>
            {[
              [policy.minLength, 'Al menos 10 caracteres'],
              [policy.uppercase, 'Una letra mayúscula y una minúscula'],
              [policy.number, 'Un número'],
              [policy.special, 'Un carácter especial'],
              [policy.allowedCharacters, 'Solo caracteres permitidos'],
              [policy.avoidsPersonalInfo, 'No incluir tu nombre, email ni código de empleado'],
            ].map(([valid, label]) => (
              <li key={String(label)} style={{ color: valid ? '#16804a' : undefined }}>{label}</li>
            ))}
          </Box>
          <Button type="submit" variant="contained" disabled={busy || !policyPassed || code.length !== 6 || password !== confirmation}>
            {busy ? 'Activando…' : 'Activar cuenta'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
