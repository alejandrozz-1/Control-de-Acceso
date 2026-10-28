-- 20261028000003 Identidad: centros, equipos, perfiles
create table if not exists centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  comunidad text,
  timezone text not null default 'Europe/Madrid',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  center_id uuid not null references centers(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  employee_code text unique,
  phone text,
  role user_role not null default 'empleado',
  center_id uuid references centers(id),
  locale text not null default 'es',
  notification_prefs jsonb not null default '{"push":true,"email":false,"tipos":{"turno":true,"acceso":true,"vacacion":true,"corporativa":true,"sistema":true}}'::jsonb,
  mfa_enabled boolean not null default false,
  status text not null default 'activo' check (status in ('activo','baja')),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists team_members (
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role member_role not null default 'miembro',
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create index if not exists idx_teams_center on teams(center_id);
create index if not exists idx_profiles_center on profiles(center_id);
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_team_members_user on team_members(user_id);

-- updated_at automático (reutilizado por el resto de migraciones)
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists set_updated_at_centers on centers;
create trigger set_updated_at_centers before update on centers
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_teams on teams;
create trigger set_updated_at_teams before update on teams
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_profiles on profiles;
create trigger set_updated_at_profiles before update on profiles
  for each row execute function public.set_updated_at();

-- Alta de perfil al crear el usuario en Supabase Auth (invitación por email)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, employee_code, role, center_id, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    nullif(new.raw_user_meta_data->>'employee_code',''),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'empleado'),
    nullif(new.raw_user_meta_data->>'center_id','')::uuid,
    'activo'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
