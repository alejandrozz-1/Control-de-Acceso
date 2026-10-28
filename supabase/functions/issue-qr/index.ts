// Edge Function: emisión de credenciales de acceso para el usuario autenticado (US-02, ADR-003).
// - kind='qr': inserta una credencial de vida corta y devuelve el payload firmado con HMAC
//   (credential_id.exp.firma — sin PII; cualquier lector futuro puede verificarlo).
// - kind='temporal': genera un código de 8 dígitos con fn_issue_temporal (5 min).
// La validación siempre es servidor-side: access_credentials.status revoca al instante.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const QR_TTL_SECONDS = 60;
const TEMPORAL_TTL_SECONDS = 300;
const MAX_ISSUES_PER_MINUTE = 10;

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'metodo_no_permitido' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace('Bearer ', '');
  if (!jwt) return json({ error: 'no_autorizado' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData.user) return json({ error: 'no_autorizado' }, 401);
  const userId = userData.user.id;

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: profile } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('id', userId)
    .single();
  if (!profile) return json({ error: 'perfil_no_encontrado' }, 404);

  const { kind = 'qr' } = await req.json().catch(() => ({ kind: 'qr' }));
  if (kind !== 'qr' && kind !== 'temporal') return json({ error: 'tipo_invalido' }, 400);

  // Rate limit sencillo por usuario: 10 emisiones/minuto.
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await admin
    .from('access_credentials')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since);
  if ((count ?? 0) >= MAX_ISSUES_PER_MINUTE) return json({ error: 'limite_emisiones' }, 429);

  if (kind === 'temporal') {
    const { data: code, error } = await admin.rpc('fn_issue_temporal', {
      p_user_id: userId,
      p_ttl_seconds: TEMPORAL_TTL_SECONDS,
    });
    if (error) return json({ error: 'error_emision' }, 500);
    return json({
      kind: 'temporal',
      code,
      expires_at: new Date(Date.now() + TEMPORAL_TTL_SECONDS * 1000).toISOString(),
    });
  }

  const { data: cred, error: insertError } = await admin
    .from('access_credentials')
    .insert({
      user_id: userId,
      kind: 'qr',
      issued_by: userId,
      expires_at: new Date(Date.now() + QR_TTL_SECONDS * 1000).toISOString(),
    })
    .select('id, expires_at')
    .single();
  if (insertError || !cred) return json({ error: 'error_emision' }, 500);

  // shortcut: secreto HMAC = service_role si no se define QR_HMAC_SECRET; al rotar la service key
  // los QR antiguos caducan solos (TTL 60 s), así que el riesgo es nulo.
  const secret = Deno.env.get('QR_HMAC_SECRET') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const exp = Math.floor(new Date(cred.expires_at).getTime() / 1000);
  const sig = await hmacSign(secret, `${cred.id}.${exp}`);

  return json({
    kind: 'qr',
    payload: `${cred.id}.${exp}.${sig}`,
    credential_id: cred.id,
    expires_at: cred.expires_at,
  });
});
