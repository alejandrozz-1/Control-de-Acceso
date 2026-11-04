import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const roles = ['empleado', 'responsable', 'admin', 'seguridad', 'recursos_humanos'] as const;
const statuses = ['activo', 'inactivo', 'bloqueado', 'pendiente_activacion'] as const;
const activationLifetimeMs = 24 * 60 * 60 * 1000;
const passwordCharacters = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%_-';

type Role = (typeof roles)[number];
type UserStatus = (typeof statuses)[number];
type Action = 'list' | 'create' | 'update' | 'block' | 'activate' | 'reset-password' | 'resend-activation' | 'delete' | 'complete-activation';
type DirectoryProfile = {
  id: string;
  email: string | null;
  full_name: string;
  employee_code: string | null;
  phone: string | null;
  role: Role;
  center_id: string | null;
  status: UserStatus;
  must_change_password: boolean;
  created_at: string;
  center: { id: string; name: string } | null;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function secureIndex(length: number): number {
  const limit = Math.floor(0x1_0000_0000 / length) * length;
  const buffer = new Uint32Array(1);
  do crypto.getRandomValues(buffer); while (buffer[0] >= limit);
  return buffer[0] % length;
}

function temporaryPassword(): string {
  const groups = [
    'abcdefghijkmnopqrstuvwxyz',
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    '23456789',
    '!@#$%_-',
  ];
  const chars = groups.map((group) => group[secureIndex(group.length)]);
  while (chars.length < 24) chars.push(passwordCharacters[secureIndex(passwordCharacters.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function activationCode(): string {
  return String(secureIndex(1_000_000)).padStart(6, '0');
}

async function hash(value: string): Promise<string> {
  const pepper = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!pepper) throw new Error('servidor_no_configurado');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function equalHash(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]!);
}

function passwordIsValid(value: string, fullName: string, email: string): boolean {
  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const personalParts = `${fullName} ${email.split('@')[0]}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length >= 3);
  return Array.from(value).length >= 10
    && /\p{Lu}/u.test(value)
    && /\p{Ll}/u.test(value)
    && /\p{N}/u.test(value)
    && /[!@#$%^&*()_+\[\]{}:;,?/|~-]/.test(value)
    && /^[\p{L}\p{N}!@#$%^&*()_+\[\]{}:;,?/|~-]+$/u.test(value)
    && !personalParts.some((part) => normalized.includes(part));
}

function validEmail(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function requiredText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

async function sendActivationEmail(email: string, fullName: string, code: string, password: string): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('RESEND_FROM_EMAIL');
  const appUrl = Deno.env.get('APP_URL')?.replace(/\/+$/, '');
  if (!apiKey || !from || !appUrl) throw new Error('email_configuration_missing');
  if (!appUrl.startsWith('https://') && !appUrl.startsWith('http://localhost')) {
    throw new Error('invalid_app_url');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Bienvenido a Repsol Control de Accesos',
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#041e42">
        <h1 style="font-size:22px">Bienvenido a Repsol Control de Accesos</h1>
        <p>Hola ${escapeHtml(fullName)},</p>
        <p>Su cuenta ha sido creada.</p>
        <p><strong>Usuario:</strong> ${escapeHtml(email)}<br>
        <strong>Código de activación:</strong> ${escapeHtml(code)}<br>
        <strong>Contraseña temporal:</strong> ${escapeHtml(password)}</p>
        <p>Acceda mediante el siguiente enlace con su contraseña temporal. A continuación deberá introducir el código y crear una nueva contraseña.</p>
        <p><a href="${escapeHtml(appUrl)}/activar" style="display:inline-block;background:#041e42;color:#fff;padding:12px 18px;text-decoration:none">Activar cuenta</a></p>
        <p>El código caduca en 24 horas. Si no esperaba este mensaje, contacte con el administrador de su organización.</p>
      </div>`,
      text: `Hola ${fullName},\n\nSu cuenta ha sido creada.\n\nUsuario: ${email}\nCódigo de activación: ${code}\nContraseña temporal: ${password}\n\nAcceda mediante ${appUrl}/activar con la contraseña temporal. Después introduzca el código y cree una nueva contraseña. El código caduca en 24 horas.`,
    }),
  });
  if (!response.ok) {
    console.error('Resend rejected the activation email', response.status);
    throw new Error('email_delivery_failed');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'metodo_no_permitido' }, 405);

  const match = /^Bearer\s+(.+)$/i.exec(req.headers.get('Authorization') ?? '');
  if (!match) return json({ error: 'no_autorizado' }, 401);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !serviceKey || !anonKey) {
    console.error('Missing Supabase environment configuration for admin-users');
    return json({ error: 'configuracion_servidor_incompleta' }, 500);
  }

  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ error: 'solicitud_invalida' }, 400);
    payload = parsed as Record<string, unknown>;
  } catch {
    return json({ error: 'solicitud_invalida' }, 400);
  }

  const caller = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${match[1]}` } } });
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData.user) return json({ error: 'no_autorizado' }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: callerProfile, error: callerProfileError } = await admin
    .from('profiles').select('role, status, must_change_password').eq('id', userData.user.id).maybeSingle();
  if (callerProfileError) {
    console.error('Could not verify the administrator profile', callerProfileError.message);
    return json({ error: 'error_verificando_permisos' }, 500);
  }
  const action = payload.action as Action | undefined;
  if (action !== 'complete-activation'
    && (callerProfile?.role !== 'admin' || callerProfile.status !== 'activo' || callerProfile.must_change_password)) {
    return json({ error: 'sin_permiso' }, 403);
  }

  try {
    if (action === 'list') {
      const { data: centers, error: centersError } = await admin.from('centers')
        .select('id, name, active').order('name');
      if (centersError) throw centersError;

      const profiles: DirectoryProfile[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await admin.from('profiles')
          .select('id, email, full_name, employee_code, phone, role, center_id, status, must_change_password, created_at, center:centers(id, name)')
          .order('full_name')
          .order('id')
          .range(offset, offset + 999);
        if (error) throw error;
        profiles.push(...data);
        if (data.length < 1000) break;
      }

      const signInById = new Map<string, string | null>();
      for (let page = 1; ; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        for (const user of data.users) signInById.set(user.id, user.last_sign_in_at ?? null);
        if (data.users.length < 1000) break;
      }

      return json({
        profiles: profiles.map((profile) => ({
          ...profile,
          last_sign_in_at: signInById.get(profile.id) ?? null,
        })),
        centers: centers ?? [],
      });
    }

    if (action === 'complete-activation') {
      if (!callerProfile?.must_change_password || !requiredText(payload.code, 6) || !/^\d{6}$/.test(payload.code)) {
        return json({ error: 'codigo_o_cuenta_invalida' }, 400);
      }
      if (typeof payload.password !== 'string' || payload.password !== payload.confirm_password) {
        return json({ error: 'contrasenas_no_coinciden' }, 400);
      }
      const { data: profile, error: profileError } = await admin
        .from('profiles').select('email, full_name').eq('id', userData.user.id).single();
      if (profileError) throw profileError;
      if (!passwordIsValid(payload.password, profile.full_name, profile.email ?? '')) {
        return json({ error: 'contrasena_no_cumple_politica' }, 400);
      }
      const { data: activation, error: activationError } = await admin
        .from('account_activations').select('code_hash, expires_at, locked_until').eq('user_id', userData.user.id).maybeSingle();
      if (activationError) throw activationError;
      if (activation?.locked_until && new Date(activation.locked_until).getTime() > Date.now()) {
        return json({ error: 'codigo_temporalmente_bloqueado' }, 429);
      }
      if (!activation || new Date(activation.expires_at).getTime() <= Date.now()
        || !equalHash(activation.code_hash, await hash(payload.code))) {
        if (activation) {
          const { error: attemptError } = await admin.rpc('fn_record_activation_attempt', { p_user_id: userData.user.id });
          if (attemptError) throw attemptError;
        }
        return json({ error: 'codigo_invalido_o_caducado' }, 400);
      }
      const { error: passwordError } = await admin.auth.admin.updateUserById(userData.user.id, { password: payload.password });
      if (passwordError) throw passwordError;
      const { data: completed, error: completeError } = await admin.rpc('fn_complete_account_activation', {
        p_user_id: userData.user.id,
        p_code_hash: activation.code_hash,
      });
      if (completeError) throw completeError;
      if (!completed) return json({ error: 'codigo_invalido_o_caducado' }, 400);
      return json({ ok: true });
    }

    if (action === 'create') {
      const givenName = typeof payload.given_name === 'string' ? payload.given_name.trim() : '';
      const familyName = typeof payload.family_name === 'string' ? payload.family_name.trim() : '';
      const fullName = `${givenName} ${familyName}`.trim();
      if (!requiredText(givenName, 100) || !requiredText(familyName, 100) || !requiredText(fullName, 180)) {
        return json({ error: 'nombre_invalido' }, 400);
      }
      if (!validEmail(payload.email)) return json({ error: 'email_invalido' }, 400);
      if (typeof payload.role !== 'string' || !roles.includes(payload.role as Role)) return json({ error: 'rol_invalido' }, 400);
      if (typeof payload.status !== 'string' || !statuses.includes(payload.status as UserStatus)) return json({ error: 'estado_invalido' }, 400);
      if (typeof payload.center_id !== 'string') return json({ error: 'centro_invalido' }, 400);
      const normalizedEmail = payload.email.trim().toLowerCase();
      const initialPassword = temporaryPassword();
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password: initialPassword,
        email_confirm: true,
        app_metadata: { user_creation: 'admin' },
        user_metadata: { full_name: fullName, role: payload.role, center_id: payload.center_id || null },
      });
      if (createError) {
        return json({ error: createError.message.includes('already been registered') ? 'ese_email_ya_existe' : 'error_creando_usuario' }, 400);
      }
      if (!created.user) return json({ error: 'error_creando_usuario' }, 500);

      const phone = typeof payload.phone === 'string' && payload.phone.trim() ? payload.phone.trim() : null;
      const { error: profileError } = await admin.from('profiles').update({
        full_name: fullName,
        email: normalizedEmail,
        phone,
        center_id: payload.center_id || null,
        role: payload.role,
        status: payload.status,
        must_change_password: true,
      }).eq('id', created.user.id);
      if (profileError) {
        const { error: cleanupError } = await admin.auth.admin.deleteUser(created.user.id);
        if (cleanupError) console.error('Could not roll back a user after a profile error', cleanupError.message);
        throw profileError;
      }
      try {
        await syncBan(admin, created.user.id, payload.status);
        await issueActivation(admin, created.user.id, normalizedEmail, fullName, initialPassword);
      } catch (error) {
        const { error: cleanupError } = await admin.auth.admin.deleteUser(created.user.id);
        if (cleanupError) console.error('Could not roll back a user after email delivery failed', cleanupError.message);
        throw error;
      }
      return json({ ok: true, user_id: created.user.id });
    }

    const targetId = typeof payload.user_id === 'string' ? payload.user_id : '';
    if (!targetId) return json({ error: 'usuario_invalido' }, 400);
    const { data: target, error: targetError } = await admin.from('profiles')
      .select('id, email, full_name, role, status, must_change_password, center_id, phone')
      .eq('id', targetId).maybeSingle();
    if (targetError) throw targetError;
    if (!target) return json({ error: 'usuario_no_encontrado' }, 404);

    if (action === 'delete' || action === 'update') {
      if (target.id === userData.user.id && action === 'delete') return json({ error: 'no_puede_eliminarse_a_si_mismo' }, 400);
      const nextRole = action === 'update' ? payload.role : target.role;
      const nextStatus = action === 'update' ? payload.status : target.status;
      if (action === 'update' && nextRole !== undefined && (typeof nextRole !== 'string' || !roles.includes(nextRole as Role))) {
        return json({ error: 'rol_invalido' }, 400);
      }
      if (action === 'update' && nextStatus !== undefined && (typeof nextStatus !== 'string' || !statuses.includes(nextStatus as UserStatus))) {
        return json({ error: 'estado_invalido' }, 400);
      }
      if (action === 'update' && nextStatus === 'pendiente_activacion' && !target.must_change_password) {
        return json({ error: 'estado_invalido' }, 400);
      }
      if (target.role === 'admin' && target.status === 'activo'
        && (action === 'delete' || nextRole !== 'admin' || nextStatus !== 'activo')) {
        const { count, error } = await admin.from('profiles').select('id', { count: 'exact', head: true })
          .eq('role', 'admin').eq('status', 'activo');
        if (error) throw error;
        if ((count ?? 0) <= 1) return json({ error: 'no_puede_eliminarse_el_ultimo_admin' }, 409);
      }
    }

    if (action === 'update') {
      const fullName = typeof payload.full_name === 'string' ? payload.full_name.trim() : target.full_name;
      const email = payload.email === undefined ? target.email : validEmail(payload.email) ? payload.email.trim().toLowerCase() : null;
      if (!requiredText(fullName, 180)) return json({ error: 'nombre_invalido' }, 400);
      if (!email) return json({ error: 'email_invalido' }, 400);
      const centerId = payload.center_id === undefined ? target.center_id : payload.center_id;
      if (centerId !== null && typeof centerId !== 'string') return json({ error: 'centro_invalido' }, 400);
      const phone = payload.phone === undefined ? target.phone : typeof payload.phone === 'string' ? payload.phone.trim() || null : null;
      const update = {
        full_name: fullName,
        email,
        phone,
        center_id: centerId,
        role: (payload.role ?? target.role) as Role,
        status: (payload.status ?? target.status) as UserStatus,
      };
      if (email !== target.email) {
        const { error } = await admin.auth.admin.updateUserById(targetId, { email, email_confirm: true });
        if (error) throw error;
      }
      const { error } = await admin.from('profiles').update(update).eq('id', targetId);
      if (error) throw error;
      await syncBan(admin, targetId, update.status);
      return json({ ok: true });
    }

    if (action === 'block' || action === 'activate') {
      const status: UserStatus = action === 'block' ? 'bloqueado' : 'activo';
      if (target.role === 'admin' && target.status === 'activo' && status !== 'activo') {
        const { count, error } = await admin.from('profiles').select('id', { count: 'exact', head: true })
          .eq('role', 'admin').eq('status', 'activo');
        if (error) throw error;
        if ((count ?? 0) <= 1) return json({ error: 'no_puede_eliminarse_el_ultimo_admin' }, 409);
      }
      const { error } = await admin.from('profiles').update({ status }).eq('id', targetId);
      if (error) throw error;
      await syncBan(admin, targetId, status);
      return json({ ok: true });
    }

    if (action === 'reset-password' || action === 'resend-activation') {
      if (action === 'resend-activation' && !target.must_change_password) {
        return json({ error: 'usuario_no_pendiente_de_activacion' }, 409);
      }
      if (!target.email) return json({ error: 'email_invalido' }, 400);
      const password = temporaryPassword();
      const { error: passwordError } = await admin.auth.admin.updateUserById(targetId, { password });
      if (passwordError) throw passwordError;
      const { error: profileError } = await admin.from('profiles').update({
        must_change_password: true,
        status: target.status === 'activo' ? 'pendiente_activacion' : target.status,
      }).eq('id', targetId);
      if (profileError) throw profileError;
      await issueActivation(admin, targetId, target.email, target.full_name, password);
      return json({ ok: true });
    }

    if (action === 'delete') {
      const { error } = await admin.auth.admin.deleteUser(targetId);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: 'accion_no_valida' }, 400);
  } catch (error) {
    console.error('admin-users operation failed', error);
    if (error instanceof Error && ['email_configuration_missing', 'invalid_app_url', 'email_delivery_failed'].includes(error.message)) {
      return json({ error: error.message }, 502);
    }
    return json({ error: 'error_procesando_solicitud' }, 500);
  }
});

async function issueActivation(
  admin: ReturnType<typeof createClient>,
  userId: string,
  email: string,
  fullName: string,
  password: string,
): Promise<void> {
  let code = '';
  let stored = false;
  for (let attempt = 0; attempt < 5 && !stored; attempt++) {
    code = activationCode();
    const { error } = await admin.from('account_activations').upsert({
      user_id: userId,
      code_hash: await hash(code),
      expires_at: new Date(Date.now() + activationLifetimeMs).toISOString(),
      attempts: 0,
      locked_until: null,
    }, { onConflict: 'user_id' });
    if (!error) stored = true;
    else if (!error.message.toLowerCase().includes('duplicate key')) throw error;
  }
  if (!stored) throw new Error('activation_code_generation_failed');
  await sendActivationEmail(email, fullName, code, password);
}

async function syncBan(admin: ReturnType<typeof createClient>, userId: string, status: string): Promise<void> {
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: status === 'bloqueado' || status === 'inactivo' ? '876000h' : 'none',
  });
  if (error) throw error;
}
