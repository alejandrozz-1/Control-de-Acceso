-- 20261030000001 Arreglos: RLS de equipos, caducidad y limpieza de credenciales

-- team_members: la policy se consultaba a sí misma y provocaba recursión infinita (42P17).
drop policy if exists team_members_select on team_members;
create policy team_members_select on team_members for select to authenticated
  using (
    user_id = auth.uid()
    or public.fn_is_team_leader(team_id)
  );

-- Las credenciales solo las emite la Edge Function con service_role.
drop policy if exists credentials_insert on access_credentials;
revoke insert on table public.access_credentials from authenticated, anon;

-- Marca como caducadas las credenciales vencidas (la llama issue-qr en cada emisión).
create or replace function public.fn_expire_credentials(p_user_id uuid default null)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  update public.access_credentials
     set status = 'caducada'
   where status = 'activa'
     and expires_at is not null
     and expires_at < now()
     and (p_user_id is null or user_id = p_user_id);
  get diagnostics v_count = row_count;
  return v_count;
end $$;

revoke all on function public.fn_expire_credentials(uuid) from public, anon, authenticated;
grant execute on function public.fn_expire_credentials(uuid) to service_role;

-- Borra QRs caducados antiguos que no tengan registros de acceso asociados.
-- shortcut: se ejecuta al emitir un QR; si algún día hay usuarios inactivos con
-- credenciales vencidas, programar fn_expire_credentials(null) con pg_cron.
create or replace function public.fn_purge_credentials(p_user_id uuid, p_keep_days integer default 1)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  delete from public.access_credentials c
   where c.user_id = p_user_id
     and c.kind = 'qr'
     and c.status = 'caducada'
     and c.expires_at < now() - make_interval(days => greatest(p_keep_days, 0))
     and not exists (
       select 1 from public.access_logs l where l.credential_id = c.id
     );
  get diagnostics v_count = row_count;
  return v_count;
end $$;

revoke all on function public.fn_purge_credentials(uuid, integer) from public, anon, authenticated;
grant execute on function public.fn_purge_credentials(uuid, integer) to service_role;

-- Devuelve también la credencial usada para poder registrar el acceso del torno.
create or replace function public.fn_check_temporal(p_code text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  c record;
begin
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
      return jsonb_build_object(
        'valid', true,
        'user_id', c.user_id,
        'credential_id', c.id,
        'reason', null
      );
    end if;
  end loop;
  return jsonb_build_object('valid', false, 'user_id', null, 'credential_id', null, 'reason', 'codigo_invalido');
end $$;

revoke all on function public.fn_check_temporal(text) from public, anon, authenticated;
grant execute on function public.fn_check_temporal(text) to service_role;
