import { supabase } from './supabase';

/** Respuestas de la Edge Function issue-qr (US-02, ADR-003). */
export interface QrCredential {
  kind: 'qr';
  payload: string;
  credential_id: string;
  expires_at: string;
}

export interface TemporalCredential {
  kind: 'temporal';
  code: string;
  expires_at: string;
}

const FRIENDLY_ERRORS: Record<string, string> = {
  limite_emisiones: 'Demasiadas solicitudes. Espera un minuto y vuelve a intentarlo.',
  no_autorizado: 'Sesión caducada. Cierra sesión y vuelve a entrar.',
  perfil_no_encontrado: 'Tu perfil todavía no está activo. Contacta con tu responsable.',
};

async function issue<T>(kind: 'qr' | 'temporal'): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('issue-qr', { body: { kind } });
  if (error) {
    const body = (error as { context?: Response }).context;
    let serverCode: string | undefined;
    if (body && typeof body.json === 'function') {
      serverCode = ((await body.json().catch(() => null)) as { error?: string } | null)?.error;
    }
    throw new Error(serverCode ? (FRIENDLY_ERRORS[serverCode] ?? 'No se pudo generar la credencial.') : 'Sin conexión con el servidor. Revisa tu red.');
  }
  return data as T;
}

export const issueQr = () => issue<QrCredential>('qr');
export const issueTemporal = () => issue<TemporalCredential>('temporal');

/** Segundos restantes hasta una fecha (mínimo 0). */
export function secondsUntil(isoDate: string, now = Date.now()): number {
  return Math.max(0, Math.floor((new Date(isoDate).getTime() - now) / 1000));
}

/** "m:ss" para el temporizador de caducidad. */
export function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
