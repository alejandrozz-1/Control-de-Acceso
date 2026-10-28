-- 20261028000004 Calendario: turnos, festivos, vacaciones, eventos
create table if not exists shift_patterns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cycle_days int not null check (cycle_days > 0 and cycle_days <= 90),
  -- {"sequence":["M","M","M","M","T","T","N","N","L","L"],
  --  "shifts":{"M":{"start":"08:00","end":"16:00","label":"Mañana","overnight":false}}}
  definition jsonb not null,
  color text not null default '#FF8200',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists shift_assignments (
  id uuid primary key default gen_random_uuid(),
  pattern_id uuid not null references shift_patterns(id),
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  start_date date not null,
  end_date date,
  rotation_offset int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  check (team_id is not null or user_id is not null),
  check (end_date is null or end_date >= start_date)
);
create index if not exists idx_shift_assignments_team on shift_assignments(team_id, start_date);
create index if not exists idx_shift_assignments_user on shift_assignments(user_id, start_date);

create table if not exists shift_entries (
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  code text not null,
  start_time time,
  end_time time,
  overnight boolean not null default false,
  primary key (user_id, date)
);
create index if not exists idx_shift_entries_date on shift_entries(date);

create table if not exists holidays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  scope holiday_scope not null default 'nacional',
  comunidad text,
  center_id uuid references centers(id) on delete cascade
);
create unique index if not exists uq_holidays on holidays (name, date, scope, coalesce(comunidad,''), coalesce(center_id::text,''));
create index if not exists idx_holidays_date on holidays(date);

create table if not exists vacation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type leave_type not null default 'vacacion',
  start_date date not null,
  end_date date not null,
  days numeric(5,1) not null check (days > 0),
  reason text,
  status request_status not null default 'pendiente',
  reviewer_id uuid references profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  check (end_date >= start_date)
);
create index if not exists idx_vacation_status on vacation_requests(status, start_date);
create index if not exists idx_vacation_user on vacation_requests(user_id, created_at desc);

create table if not exists corporate_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  center_id uuid references centers(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  check (ends_at is null or ends_at >= starts_at)
);
create index if not exists idx_events_range on corporate_events(starts_at);

drop trigger if exists set_updated_at_shift_patterns on shift_patterns;
create trigger set_updated_at_shift_patterns before update on shift_patterns
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_shift_assignments on shift_assignments;
create trigger set_updated_at_shift_assignments before update on shift_assignments
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_vacation on vacation_requests;
create trigger set_updated_at_vacation before update on vacation_requests
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_events on corporate_events;
create trigger set_updated_at_events before update on corporate_events
  for each row execute function public.set_updated_at();

-- Materializa los turnos por fecha a partir de los patrones rotativos.
-- shortcut: materializa solo hasta +365 días desde hoy; ampliar con job Edge cuando se necesite más horizonte,
-- y limpiar entradas obsoletas al modificar/eliminar asignaciones (pendiente T-013).
create or replace function public.fn_generate_shift_entries(p_from date, p_to date, p_user uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  a record;
  d date;
  idx int;
  code text;
  sh jsonb;
begin
  for a in
    select asg.id, asg.team_id, asg.user_id, asg.start_date, asg.end_date, asg.rotation_offset,
           p.cycle_days,
           p.definition->'sequence' as seq,
           p.definition->'shifts' as shifts
    from shift_assignments asg
    join shift_patterns p on p.id = asg.pattern_id
    where asg.start_date <= p_to
      and coalesce(asg.end_date, '9999-12-31'::date) >= p_from
      and (p_user is null
           or asg.user_id = p_user
           or exists (select 1 from team_members tm where tm.team_id = asg.team_id and tm.user_id = p_user))
  loop
    for d in select generate_series(greatest(a.start_date, p_from)::timestamp, least(coalesce(a.end_date, '9999-12-31'), p_to)::timestamp, interval '1 day')::date loop
      idx := mod((d - a.start_date) + a.rotation_offset, a.cycle_days);
      code := a.seq ->> idx;
      if code is null then
        continue;
      end if;
      sh := a.shifts -> code;
      if a.team_id is not null then
        insert into shift_entries (user_id, date, code, start_time, end_time, overnight)
        select m.user_id, d, code,
               nullif(sh->>'start','')::time,
               nullif(sh->>'end','')::time,
               coalesce((sh->>'overnight')::boolean, false)
        from team_members m
        where m.team_id = a.team_id
        on conflict (user_id, date) do update
          set code = excluded.code, start_time = excluded.start_time,
              end_time = excluded.end_time, overnight = excluded.overnight;
      else
        insert into shift_entries (user_id, date, code, start_time, end_time, overnight)
        values (a.user_id, d, code,
                nullif(sh->>'start','')::time,
                nullif(sh->>'end','')::time,
                coalesce((sh->>'overnight')::boolean, false))
        on conflict (user_id, date) do update
          set code = excluded.code, start_time = excluded.start_time,
              end_time = excluded.end_time, overnight = excluded.overnight;
      end if;
    end loop;
  end loop;
end $$;

create or replace function public.trg_regenerate_shift_entries() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.fn_generate_shift_entries(
    greatest(coalesce(new.start_date, old.start_date), current_date - 30),
    least(coalesce(new.end_date, old.end_date, '9999-12-31'::date), current_date + 365)
  );
  return coalesce(new, old);
end $$;

drop trigger if exists shift_assignments_regenerate on shift_assignments;
create trigger shift_assignments_regenerate after insert or update or delete on shift_assignments
  for each row execute function public.trg_regenerate_shift_entries();

create or replace function public.trg_regenerate_member_entries() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.fn_generate_shift_entries(current_date - 30, current_date + 365, coalesce(new.user_id, old.user_id));
  return null;
end $$;

drop trigger if exists team_members_regenerate on team_members;
create trigger team_members_regenerate after insert or delete on team_members
  for each row execute function public.trg_regenerate_member_entries();
