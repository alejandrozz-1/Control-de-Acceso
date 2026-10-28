-- 20261028000005 Acceso: credenciales y registros
create table if not exists access_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind credential_kind not null default 'qr',
  token_hash text,
  expires_at timestamptz,
  used_at timestamptz,
  max_attempts int not null default 5,
  attempts_used int not null default 0,
  nfc_uid text unique,
  status credential_status not null default 'activa',
  issued_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references profiles(id),
  last_used_at timestamptz
);
create index if not exists idx_credentials_user on access_credentials(user_id, status);
create unique index if not exists uq_credentials_token on access_credentials(token_hash) where token_hash is not null;

create table if not exists access_logs (
  id bigint generated always as identity primary key,
  credential_id uuid references access_credentials(id) on delete set null,
  user_id uuid not null references profiles(id) on delete cascade,
  event access_event not null,
  method access_method not null default 'qr',
  source access_source not null default 'app',
  center_id uuid references centers(id),
  recorded_by uuid references profiles(id),
  scanned_at timestamptz not null default now(),
  meta jsonb
);
create index if not exists idx_access_logs_user_time on access_logs(user_id, scanned_at desc);
create index if not exists idx_access_logs_center_time on access_logs(center_id, scanned_at desc);
create index if not exists idx_access_logs_credential on access_logs(credential_id);
create index if not exists idx_access_logs_event_time on access_logs(event, scanned_at desc);

-- Vista base de métricas de asistencia (se promoverá a materializada en Fase 5 si crece)
create or replace view public.mv_assistance_daily as
select
  l.user_id,
  l.scanned_at::date as day,
  min(l.scanned_at) filter (where l.event = 'entrada') as first_in,
  max(l.scanned_at) filter (where l.event = 'salida') as last_out,
  count(*) filter (where l.event = 'entrada') as entries
from access_logs l
where l.event <> 'denegado'
group by l.user_id, l.scanned_at::date;

-- Emite un código temporal de 8 dígitos (uso del servidor: solo Edge Functions service_role)
create or replace function public.fn_issue_temporal(p_user_id uuid, p_ttl_seconds int default 300)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  v_code text;
begin
  v_code := lpad(floor(random() * 100000000)::text, 8, '0');
  insert into access_credentials (user_id, kind, token_hash, expires_at, issued_by)
  values (p_user_id, 'temporal', extensions.crypt(v_code, extensions.gen_salt('bf', 10)),
          now() + make_interval(secs => p_ttl_seconds), p_user_id);
  return v_code;
end $$;

-- Valida un código temporal (uso del servidor)
create or replace function public.fn_check_temporal(p_code text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  c record;
begin
  -- shortcut: el límite de intentos por IP/usuario se aplica en la Edge Function (rate limit);
  -- attempts_used queda para la futura integración con tornos (ADR-003).
  for c in
    select * from access_credentials
    where kind = 'temporal' and token_hash is not null and status = 'activa'
      and expires_at > now()
    order by created_at desc
    limit 50
  loop
    if extensions.crypt(p_code, c.token_hash) = c.token_hash then
      update access_credentials
      set used_at = now(), status = 'caducada', last_used_at = now()
      where id = c.id;
      return jsonb_build_object('valid', true, 'user_id', c.user_id, 'reason', null);
    end if;
  end loop;
  return jsonb_build_object('valid', false, 'user_id', null, 'reason', 'codigo_invalido');
end $$;

-- Registra un acceso validando la credencial en servidor (revocación instantánea)
create or replace function public.fn_register_access(
  p_credential_id uuid,
  p_event access_event,
  p_source access_source default 'app',
  p_method access_method default 'qr'
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c record;
  v_valid boolean := false;
  v_reason text := null;
begin
  select * into c from access_credentials where id = p_credential_id;
  if c is null then
    return jsonb_build_object('valid', false, 'user_id', null, 'reason', 'desconocida');
  end if;

  if c.status <> 'activa' then
    v_reason := 'revocada';
  elsif c.expires_at is not null and c.expires_at < now() then
    v_reason := 'caducada';
  else
    v_valid := true;
  end if;

  insert into access_logs (credential_id, user_id, event, method, source, meta)
  values (
    p_credential_id,
    c.user_id,
    case when v_valid then p_event else 'denegado' end,
    p_method,
    p_source,
    case when v_reason is null then null else jsonb_build_object('reason', v_reason) end
  );

  if v_valid and p_event = 'entrada' then
    update access_credentials set last_used_at = now() where id = p_credential_id;
  end if;

  return jsonb_build_object('valid', v_valid, 'user_id', c.user_id, 'reason', v_reason);
end $$;

-- Solo service_role (Edge Functions); ningún cliente puede emitir/validar directamente
revoke all on function public.fn_issue_temporal(uuid, int) from public, anon, authenticated;
revoke all on function public.fn_check_temporal(text) from public, anon, authenticated;
revoke all on function public.fn_register_access(uuid, access_event, access_source, access_method) from public, anon, authenticated;
grant execute on function public.fn_issue_temporal(uuid, int) to service_role;
grant execute on function public.fn_check_temporal(text) to service_role;
grant execute on function public.fn_register_access(uuid, access_event, access_source, access_method) to service_role;
