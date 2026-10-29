import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useState, type FormEvent } from 'react';
import AccountSubpage from './AccountSubpage';
import { useAuthStore } from '../../services/auth';
import { supabase } from '../../services/supabase';
import { checkPasswordPolicy } from './passwordPolicy';

const POLICY_LABELS = [
  ['minLength', 'Al menos 10 caracteres'],
  ['uppercase', 'Al menos una letra mayúscula'],
  ['lowercase', 'Al menos una letra minúscula'],
  ['number', 'Al menos un número'],
  ['special', 'Al menos un símbolo permitido'],
  ['allowedCharacters', 'Sin espacios, puntos ni símbolos no permitidos'],
  ['avoidsPersonalInfo', 'Sin nombre, apellidos, ID ni usuario del correo'],
] as const;
const ALLOWED_SYMBOLS = '! @ # $ % ^ & * ( ) _ - + = [ ] { } : ; , ? / | ~';

export default function Seguridad() {
  const { profile } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const policy = checkPasswordPolicy(newPassword, {
    full_name: profile?.full_name ?? '',
    email: profile?.email ?? null,
    employee_code: profile?.employee_code ?? null,
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!profile?.email) {
      setError('No se encontró el correo de la cuenta para verificar tu contraseña actual.');
      return;
    }
    if (!Object.values(policy).every(Boolean)) {
      setError('La nueva contraseña no cumple todos los requisitos indicados.');
      return;
    }
    if (newPassword !== confirmation) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('La nueva contraseña debe ser diferente de la actual.');
      return;
    }

    setBusy(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: currentPassword,
      });
      if (verifyError) {
        setError(
          verifyError.message === 'Invalid login credentials'
            ? 'La contraseña actual no es correcta.'
            : 'No se pudo verificar la contraseña actual. Inténtalo de nuevo.',
        );
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError('No se pudo actualizar la contraseña. Comprueba los requisitos e inténtalo de nuevo.');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      setSuccess('Tu contraseña se ha actualizado correctamente.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AccountSubpage title="Seguridad" description="Protege el acceso a tu cuenta">
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <LockOutlinedIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Cambiar contraseña
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Para confirmar el cambio, primero tendrás que verificar tu contraseña actual.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Símbolos aceptados: {ALLOWED_SYMBOLS}
        </Typography>

        {error && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" role="status" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            fullWidth
            helperText="Se comprueban los requisitos mientras escribes."
          />
          <List dense disablePadding aria-label="Requisitos de la contraseña">
            {POLICY_LABELS.map(([key, label]) => {
              const isValid = policy[key];
              const Icon = isValid ? CheckCircleOutlineIcon : RadioButtonUncheckedIcon;
              return (
                <ListItem key={key} disableGutters sx={{ py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 32, color: isValid ? 'success.main' : 'text.secondary' }}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    slotProps={{ primary: { variant: 'body2', color: isValid ? 'text.primary' : 'text.secondary' } }}
                  />
                </ListItem>
              );
            })}
          </List>
          <TextField
            label="Repite la nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={busy} sx={{ minHeight: 48, borderRadius: 3 }}>
            {busy ? 'Actualizando…' : 'Cambiar contraseña'}
          </Button>
        </Box>
      </Paper>
    </AccountSubpage>
  );
}
