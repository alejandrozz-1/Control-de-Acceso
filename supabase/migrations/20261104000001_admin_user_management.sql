-- Administración de usuarios: roles, estados, activación y centros corporativos.
alter type public.user_role add value if not exists 'seguridad';
alter type public.user_role add value if not exists 'recursos_humanos';

alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

alter table public.profiles drop constraint if exists profiles_status_check;
update public.profiles set status = 'inactivo' where status = 'baja';
alter table public.profiles
  add constraint profiles_status_check
  check (status in ('activo', 'inactivo', 'bloqueado', 'pendiente_activacion'));
alter table public.profiles
  add constraint profiles_activation_status_check
  check (status <> 'pendiente_activacion' or must_change_password);

-- Never trust role/center values from public signup's user_metadata.
-- Only service-created users and deterministic development seed users carry this app_metadata marker.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_admin_created boolean := new.raw_app_meta_data->>'user_creation' = 'admin';
  v_seed_user boolean := new.raw_app_meta_data->>'user_creation' = 'seed';
begin
  insert into public.profiles (
    id, email, full_name, employee_code, role, center_id, status, must_change_password
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when v_admin_created or v_seed_user then nullif(new.raw_user_meta_data->>'employee_code', '') else null end,
    case
      when v_admin_created or v_seed_user
        then coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'empleado')
      else 'empleado'::public.user_role
    end,
    case when v_admin_created or v_seed_user then nullif(new.raw_user_meta_data->>'center_id', '')::uuid else null end,
    case when v_seed_user then 'activo' when v_admin_created then 'pendiente_activacion' else 'bloqueado' end,
    not v_seed_user
  )
  on conflict (id) do nothing;
  return new;
end $$;

insert into public.centers (name)
select requested.name
from (values ('Campus Repsol'), ('Puertollano'), ('Tarragona'), ('A Coruña')) as requested(name)
where not exists (
  select 1 from public.centers existing
  where lower(existing.name) = lower(requested.name)
);

create table if not exists public.account_activations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code_hash text not null unique,
  expires_at timestamptz not null,
  attempts smallint not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

alter table public.account_activations enable row level security;
revoke all on public.account_activations from public, anon, authenticated;
grant all on public.account_activations to service_role;

create or replace function public.fn_complete_account_activation(p_user_id uuid, p_code_hash text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  delete from public.account_activations
  where user_id = p_user_id
    and code_hash = p_code_hash
    and expires_at > now();
  if not found then
    return false;
  end if;

  update public.profiles
  set must_change_password = false,
      status = case when status = 'pendiente_activacion' then 'activo' else status end
  where id = p_user_id and must_change_password;
  if not found then
    raise exception 'account_activation_invalid';
  end if;
  return true;
end $$;

revoke all on function public.fn_complete_account_activation(uuid, text) from public, anon, authenticated;
grant execute on function public.fn_complete_account_activation(uuid, text) to service_role;

create or replace function public.fn_record_activation_attempt(p_user_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.account_activations
  set attempts = least(attempts + 1, 5),
      locked_until = case when attempts + 1 >= 5 then now() + interval '15 minutes' else locked_until end
  where user_id = p_user_id;
$$;

revoke all on function public.fn_record_activation_attempt(uuid) from public, anon, authenticated;
grant execute on function public.fn_record_activation_attempt(uuid) to service_role;

create or replace function public.fn_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select role = 'admin' and status = 'activo'
    from profiles where id = auth.uid()
  ), false);
$$;

create or replace function public.fn_is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select role in ('admin','responsable') and status = 'activo'
    from profiles where id = auth.uid()
  ), false);
$$;

create or replace function public.fn_is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select status = 'activo' and not must_change_password
    from profiles where id = auth.uid()
  ), false);
$$;

revoke execute on function public.fn_is_active_user() from public, anon;
grant execute on function public.fn_is_active_user() to authenticated;

-- A JWT issued before a block/disable must stop reading or writing business data immediately.
-- Pending users may read only their own profile to reach the mandatory activation screen.
drop policy if exists active_account_required on public.profiles;
create policy active_account_required on public.profiles as restrictive for all to authenticated
  using (public.fn_is_active_user() or id = auth.uid())
  with check (public.fn_is_active_user() or id = auth.uid());

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'centers', 'teams', 'team_members', 'shift_patterns', 'shift_assignments',
    'shift_entries', 'holidays', 'corporate_events', 'vacation_requests',
    'access_credentials', 'access_logs', 'notifications', 'push_subscriptions',
    'app_settings', 'audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists active_account_required on public.%I', table_name);
    execute format(
      'create policy active_account_required on public.%I as restrictive for all to authenticated using (public.fn_is_active_user()) with check (public.fn_is_active_user())',
      table_name
    );
  end loop;
end $$;
