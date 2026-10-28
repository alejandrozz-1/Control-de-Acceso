-- 20261028000007 Auditoría, triggers de negocio y RLS (políticas por tabla)

-- ===== Helpers de autorización (security definer: evitan recursión de RLS) =====
create or replace function public.fn_my_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function public.fn_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

create or replace function public.fn_is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin','responsable') from profiles where id = auth.uid()), false);
$$;

-- ¿Es admin o líder del equipo de p_user?
create or replace function public.fn_leads_user(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    public.fn_is_admin() or exists (
      select 1 from team_members me
      join team_members tgt on tgt.team_id = me.team_id and tgt.user_id = p_user
      where me.user_id = auth.uid() and me.role = 'lider'
    ), false);
$$;

-- ¿Comparten equipo?
create or replace function public.fn_shares_team(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(exists (
    select 1 from team_members a
    join team_members b on a.team_id = b.team_id
    where a.user_id = auth.uid() and b.user_id = p_user
  ), false);
$$;

create or replace function public.fn_is_team_leader(p_team uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.fn_is_admin() or exists (
    select 1 from team_members
    where team_id = p_team and user_id = auth.uid() and role = 'lider'
  ), false);
$$;

grant execute on function public.fn_my_role() to authenticated;
grant execute on function public.fn_is_admin() to authenticated;
grant execute on function public.fn_is_staff() to authenticated;
grant execute on function public.fn_leads_user(uuid) to authenticated;
grant execute on function public.fn_shares_team(uuid) to authenticated;
grant execute on function public.fn_is_team_leader(uuid) to authenticated;

-- ===== Auditoría append-only =====
create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references profiles(id),
  action text not null,
  entity text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  ip inet,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_created on audit_logs(created_at desc);
create index if not exists idx_audit_actor on audit_logs(actor_id, created_at desc);
revoke update, delete on audit_logs from public, anon, authenticated, service_role;

create or replace function public.fn_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_rec jsonb;
  v_old jsonb;
  v_id text;
begin
  if TG_OP = 'INSERT' then
    v_rec := to_jsonb(new);
  elsif TG_OP = 'UPDATE' then
    v_rec := to_jsonb(new);
    v_old := to_jsonb(old);
  else
    v_rec := to_jsonb(old);
  end if;
  v_id := coalesce(v_rec->>'id', v_rec->>'key', (v_rec->>'team_id') || ':' || (v_rec->>'user_id'));
  insert into audit_logs (actor_id, action, entity, entity_id, old_data, new_data)
  values (auth.uid(), TG_OP, TG_TABLE_NAME, v_id,
          v_old, case when TG_OP <> 'UPDATE' then v_rec end);
  return case when TG_OP = 'DELETE' then old else new end;
end $$;

drop trigger if exists audit_access_credentials on access_credentials;
create trigger audit_access_credentials after insert or update or delete on access_credentials
  for each row execute function public.fn_audit();
drop trigger if exists audit_vacation_requests on vacation_requests;
create trigger audit_vacation_requests after insert or update or delete on vacation_requests
  for each row execute function public.fn_audit();
drop trigger if exists audit_profiles on profiles;
create trigger audit_profiles after update on profiles
  for each row execute function public.fn_audit();
drop trigger if exists audit_teams on teams;
create trigger audit_teams after insert or update or delete on teams
  for each row execute function public.fn_audit();
drop trigger if exists audit_team_members on team_members;
create trigger audit_team_members after insert or update or delete on team_members
  for each row execute function public.fn_audit();
drop trigger if exists audit_shift_assignments on shift_assignments;
create trigger audit_shift_assignments after insert or update or delete on shift_assignments
  for each row execute function public.fn_audit();
drop trigger if exists audit_app_settings on app_settings;
create trigger audit_app_settings after update on app_settings
  for each row execute function public.fn_audit();

-- ===== Protección de privilegios en profiles =====
create or replace function public.fn_protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new; -- service_role / SQL editor
  end if;
  if new.id <> auth.uid() then
    if not public.fn_is_admin() then
      raise exception 'sin_permiso: solo admin edita otros perfiles';
    end if;
  elsif new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.center_id is distinct from old.center_id then
    if not public.fn_is_admin() then
      raise exception 'sin_permiso: solo admin cambia rol/estado/centro';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_profile on profiles;
create trigger protect_profile before update on profiles
  for each row execute function public.fn_protect_profile();

-- ===== Aprobación de vacaciones (solo líder/admin) + notificación =====
create or replace function public.fn_vacation_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('aprobada','rechazada') then
    if auth.uid() is not null and not (public.fn_is_admin() or public.fn_leads_user(old.user_id)) then
      raise exception 'sin_permiso: solo el líder del equipo o un admin decide solicitudes';
    end if;
    new.reviewer_id := coalesce(auth.uid(), old.reviewer_id);
    new.decided_at := now();
    insert into notifications (user_id, type, title, body, data)
    values (old.user_id, 'vacacion',
            case when new.status = 'aprobada' then 'Vacaciones aprobadas' else 'Vacaciones rechazadas' end,
            'Tu solicitud del ' || to_char(old.start_date, 'DD/MM/YYYY') || ' al ' || to_char(old.end_date, 'DD/MM/YYYY'),
            jsonb_build_object('request_id', old.id, 'status', new.status));
  end if;
  if new.status is distinct from old.status and new.status = 'anulada' and auth.uid() is not null then
    if not (public.fn_is_admin() or old.user_id = auth.uid() or public.fn_leads_user(old.user_id)) then
      raise exception 'sin_permiso';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists vacation_review on vacation_requests;
create trigger vacation_review before update on vacation_requests
  for each row execute function public.fn_vacation_review();

-- ===== Notificación al revocar credencial =====
create or replace function public.fn_notify_credential_revoked() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'revocada' and old.status is distinct from 'revocada' then
    insert into notifications (user_id, type, title, body, data)
    values (new.user_id, 'acceso', 'Credencial revocada',
            'Se ha revocado tu credencial de acceso', jsonb_build_object('credential_id', new.id));
  end if;
  return new;
end $$;

drop trigger if exists notify_credential_revoked on access_credentials;
create trigger notify_credential_revoked after update on access_credentials
  for each row execute function public.fn_notify_credential_revoked();

-- ===== RLS =====
alter table centers enable row level security;
alter table teams enable row level security;
alter table profiles enable row level security;
alter table team_members enable row level security;
alter table shift_patterns enable row level security;
alter table shift_assignments enable row level security;
alter table shift_entries enable row level security;
alter table holidays enable row level security;
alter table vacation_requests enable row level security;
alter table corporate_events enable row level security;
alter table access_credentials enable row level security;
alter table access_logs enable row level security;
alter table notifications enable row level security;
alter table push_subscriptions enable row level security;
alter table app_settings enable row level security;
alter table audit_logs enable row level security;

-- centers
drop policy if exists centers_select on centers;
create policy centers_select on centers for select to authenticated using (true);
drop policy if exists centers_write on centers;
create policy centers_write on centers for all to authenticated
  using (public.fn_is_admin()) with check (public.fn_is_admin());

-- teams
drop policy if exists teams_select on teams;
create policy teams_select on teams for select to authenticated using (true);
drop policy if exists teams_write on teams;
create policy teams_write on teams for all to authenticated
  using (public.fn_is_admin()) with check (public.fn_is_admin());

-- profiles
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to authenticated
  using (id = auth.uid() or public.fn_is_admin() or public.fn_leads_user(id) or public.fn_shares_team(id));
drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles for insert to authenticated
  with check (public.fn_is_admin());
drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update to authenticated
  using (id = auth.uid() or public.fn_is_admin())
  with check (id = auth.uid() or public.fn_is_admin());
drop policy if exists profiles_delete on profiles;
create policy profiles_delete on profiles for delete to authenticated
  using (public.fn_is_admin());

-- team_members
drop policy if exists team_members_select on team_members;
create policy team_members_select on team_members for select to authenticated
  using (
    user_id = auth.uid()
    or public.fn_is_staff()
    or exists (select 1 from team_members me
               where me.user_id = auth.uid() and me.role = 'lider' and me.team_id = team_members.team_id)
  );
drop policy if exists team_members_write on team_members;
create policy team_members_write on team_members for all to authenticated
  using (public.fn_is_admin()) with check (public.fn_is_admin());

-- turnos
drop policy if exists shift_patterns_select on shift_patterns;
create policy shift_patterns_select on shift_patterns for select to authenticated using (true);
drop policy if exists shift_patterns_write on shift_patterns;
create policy shift_patterns_write on shift_patterns for all to authenticated
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists shift_assignments_select on shift_assignments;
create policy shift_assignments_select on shift_assignments for select to authenticated using (true);
drop policy if exists shift_assignments_write on shift_assignments;
create policy shift_assignments_write on shift_assignments for all to authenticated
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists shift_entries_select on shift_entries;
create policy shift_entries_select on shift_entries for select to authenticated
  using (user_id = auth.uid() or public.fn_is_admin() or public.fn_leads_user(user_id) or public.fn_shares_team(user_id));

-- calendario compartido
drop policy if exists holidays_select on holidays;
create policy holidays_select on holidays for select to authenticated using (true);
drop policy if exists holidays_write on holidays;
create policy holidays_write on holidays for all to authenticated
  using (public.fn_is_admin()) with check (public.fn_is_admin());

drop policy if exists events_select on corporate_events;
create policy events_select on corporate_events for select to authenticated using (true);
drop policy if exists events_write on corporate_events;
create policy events_write on corporate_events for all to authenticated
  using (public.fn_is_admin()) with check (public.fn_is_admin());

-- vacaciones
drop policy if exists vacation_select on vacation_requests;
create policy vacation_select on vacation_requests for select to authenticated
  using (user_id = auth.uid() or public.fn_is_admin() or public.fn_leads_user(user_id));
drop policy if exists vacation_insert on vacation_requests;
create policy vacation_insert on vacation_requests for insert to authenticated
  with check (user_id = auth.uid() and status = 'pendiente');
drop policy if exists vacation_update on vacation_requests;
create policy vacation_update on vacation_requests for update to authenticated
  using (user_id = auth.uid() or public.fn_is_admin() or public.fn_leads_user(user_id))
  with check (user_id = auth.uid() or public.fn_is_admin() or public.fn_leads_user(user_id));
drop policy if exists vacation_delete on vacation_requests;
create policy vacation_delete on vacation_requests for delete to authenticated
  using (public.fn_is_admin());

-- credenciales
drop policy if exists credentials_select on access_credentials;
create policy credentials_select on access_credentials for select to authenticated
  using (user_id = auth.uid() or public.fn_is_admin() or public.fn_leads_user(user_id));
drop policy if exists credentials_insert on access_credentials;
create policy credentials_insert on access_credentials for insert to authenticated
  with check (user_id = auth.uid() or public.fn_is_admin() or public.fn_leads_user(user_id));
drop policy if exists credentials_update on access_credentials;
create policy credentials_update on access_credentials for update to authenticated
  using (public.fn_is_admin() or public.fn_leads_user(user_id))
  with check (public.fn_is_admin() or public.fn_leads_user(user_id));
drop policy if exists credentials_delete on access_credentials;
create policy credentials_delete on access_credentials for delete to authenticated
  using (public.fn_is_admin());

-- registros (inmutables: sin UPDATE/DELETE para clientes)
drop policy if exists access_logs_select on access_logs;
create policy access_logs_select on access_logs for select to authenticated
  using (user_id = auth.uid() or public.fn_is_admin() or public.fn_leads_user(user_id));
drop policy if exists access_logs_insert on access_logs;
create policy access_logs_insert on access_logs for insert to authenticated
  with check (public.fn_is_admin() or public.fn_leads_user(user_id));

-- notificaciones
drop policy if exists notifications_select on notifications;
create policy notifications_select on notifications for select to authenticated
  using (user_id = auth.uid());
drop policy if exists notifications_insert on notifications;
create policy notifications_insert on notifications for insert to authenticated
  with check (public.fn_is_admin());
drop policy if exists notifications_update on notifications;
create policy notifications_update on notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notifications_delete on notifications;
create policy notifications_delete on notifications for delete to authenticated
  using (user_id = auth.uid());

-- push
drop policy if exists push_subs_all on push_subscriptions;
create policy push_subs_all on push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- configuración
drop policy if exists app_settings_select on app_settings;
create policy app_settings_select on app_settings for select to authenticated using (true);
drop policy if exists app_settings_write on app_settings;
create policy app_settings_write on app_settings for all to authenticated
  using (public.fn_is_admin()) with check (public.fn_is_admin());

-- auditoría (solo admin lee; escritura solo por triggers definer/owner)
drop policy if exists audit_select on audit_logs;
create policy audit_select on audit_logs for select to authenticated
  using (public.fn_is_admin());
