// Edge Function: validación de credenciales desde el torno (ADR-003).
// - QR: payload `credential_id.exp.firma` firmado con HMAC; se verifica la firma aquí.
// - Temporal: código de 8 dígitos; se valida contra el hash bcrypt de la BD.
// Autenticación del dispositivo: header `x-device-key` == secreto TURNSTILE_API_KEY.
// El evento (entrada/salida) se alterna según el último acceso del usuario, salvo
// que el torno envíe `direction`.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-key',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

type Direction = 'entrada' | 'salida';

async function nextEvent(
  admin: ReturnType<typeof createClient>,
  userId: string,
  requested: unknown,
): Promise<Direction> {
  if (requested === 'entrada' || requested === 'salida') return requested;
  const { data } = await admin
    .from('access_logs')
    .select('event')
    .eq('user_id', userId)
    .in('event', ['entrada', 'salida'])
    .order('scanned_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.event === 'entrada' ? 'salida' : 'entrada';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'metodo_no_permitido' }, 405);

  const expectedKey = Deno.env.get('TURNSTILE_API_KEY');
  if (!expectedKey) return json({ error: 'dispositivo_no_configurado' }, 500);
  if (!safeEqual(req.headers.get('x-device-key') ?? '', expectedKey)) {
    return json({ error: 'no_autorizado' }, 401);
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const body = await req.json().catch(() => ({}));

  if (typeof body.code === 'string' && body.code.trim()) {
    const { data: result, error } = await admin.rpc('fn_check_temporal', {
      p_code: body.code.trim(),
    });
    if (error) return json({ error: 'error_validacion' }, 500);
    if (!result?.valid) {
      return json({ valid: false, reason: result?.reason ?? 'codigo_invalido' }, 401);
    }
    const event = await nextEvent(admin, result.user_id, body.direction);
    const { error: logError } = await admin.from('access_logs').insert({
      credential_id: result.credential_id,
      user_id: result.user_id,
      event,
      method: 'temporal',
      source: 'torno',
    });
    if (logError) return json({ error: 'error_registro' }, 500);
    return json({ valid: true, event, user_id: result.user_id });
  }

  if (typeof body.payload !== 'string') return json({ error: 'payload_invalido' }, 400);
  const parts = body.payload.split('.');
  if (parts.length !== 3) return json({ valid: false, reason: 'payload_invalido' }, 400);

  const [credentialId, expRaw, signature] = parts;
  const exp = Number(expRaw);
  if (!/^[0-9a-f-]{36}$/i.test(credentialId) || !Number.isInteger(exp)) {
    return json({ valid: false, reason: 'payload_invalido' }, 400);
  }
  if (exp * 1000 < Date.now()) return json({ valid: false, reason: 'caducada' }, 401);

  // Mismo secreto que issue-qr (ver shortcut allí).
  const secret = Deno.env.get('QR_HMAC_SECRET') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const expectedSignature = await hmacSign(secret, `${credentialId}.${exp}`);
  if (!safeEqual(signature, expectedSignature)) {
    return json({ valid: false, reason: 'firma_invalida' }, 401);
  }

  const { data: credential } = await admin
    .from('access_credentials')
    .select('user_id')
    .eq('id', credentialId)
    .maybeSingle();
  if (!credential) return json({ valid: false, reason: 'desconocida' }, 404);

  const event = await nextEvent(admin, credential.user_id, body.direction);
  const { data: result, error } = await admin.rpc('fn_register_access', {
    p_credential_id: credentialId,
    p_event: event,
    p_source: 'torno',
    p_method: 'qr',
  });
  if (error) return json({ error: 'error_registro' }, 500);

  return json({ ...result, event: result?.valid ? event : null }, result?.valid ? 200 : 401);
});
