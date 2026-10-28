// Edge Function: alta de usuarios por email (solo admin/responsable autenticado).
// Usa service_role de forma segura: verifica el rol del llamante en profiles
// antes de invocar auth.admin.inviteUserByEmail (ADR-002: secretos en servidor).
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'metodo_no_permitido' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace('Bearer ', '');
  if (!jwt) return json({ error: 'no_autorizado' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Cliente con el JWT del llamante para identificarlo
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData.user) return json({ error: 'no_autorizado' }, 401);

  // Solo admin puede invitar (los responsables no dan de alta)
  const admin = createClient(url, serviceKey);
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();
  if (profile?.role !== 'admin') return json({ error: 'sin_permiso' }, 403);

  const { email, full_name, role, center_id } = await req.json();
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return json({ error: 'email_invalido' }, 400);
  }
  const validRoles = ['empleado', 'responsable', 'admin'];
  if (role && !validRoles.includes(role)) return json({ error: 'rol_invalido' }, 400);

  // shortcut: sin rate limit por IP aún; añadir (Upstash/Postgres) si hay abuso real —
  // la invitación queda auditada en audit_logs vía trigger de profiles.

  const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(email.trim(), {
    data: { full_name: full_name ?? '', role: role ?? 'empleado', center_id: center_id ?? '' },
  });
  if (error) {
    const detail = error.message;
    const msg = detail.includes('already been registered')
      ? 'ese_email_ya_existe'
      : detail.includes('rate limit')
        ? 'limite_invitaciones_alcanzado'
        : 'error_invitacion';
    return json({ error: msg, detail }, 400);
  }

  return json({ ok: true, user_id: invited.user?.id ?? null });
});
