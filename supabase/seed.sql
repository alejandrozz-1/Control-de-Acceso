-- Seed determinista de ejemplo — SOLO ENTORNO DE DESARROLLO/TEST
-- Usuarios de prueba (todos con contraseña "Password123!"):
--   admin@test.local (admin) · lider@test.local, sup2@test.local, sup3@test.local (responsables)
--   emp1..emp6@test.local (empleados)
-- Ids fijos para que los tests e2e puedan depender de ellos.
begin;

-- ===== Centros =====
insert into centers (id, name, address, comunidad) values
  ('00000000-0000-0000-0000-0000000000c1', 'Repsol Madrid — Torre Cristal', 'Paseo de la Castellana 259, Madrid', 'madrid'),
  ('00000000-0000-0000-0000-0000000000c2', 'Repsol Cartagena — Refino', 'Ctra. de la Aljorra, Cartagena', 'murcia')
on conflict do nothing;

-- ===== Usuarios (auth + profile por trigger) =====
do $$
declare
  u record;
  v_users jsonb := '[
    ["00000000-0000-0000-0000-0000000000a1","admin@test.local","Ana Admin","E0001","admin","00000000-0000-0000-0000-0000000000c1"],
    ["00000000-0000-0000-0000-0000000000b1","lider@test.local","Lidia Líder","E0011","responsable","00000000-0000-0000-0000-0000000000c1"],
    ["00000000-0000-0000-0000-0000000000b2","sup2@test.local","Sergio Supervisor","E0012","responsable","00000000-0000-0000-0000-0000000000c1"],
    ["00000000-0000-0000-0000-0000000000b3","sup3@test.local","Sara Supervisora","E0013","responsable","00000000-0000-0000-0000-0000000000c2"],
    ["00000000-0000-0000-0000-0000000000e1","emp1@test.local","Eva Empleada","E0021","empleado","00000000-0000-0000-0000-0000000000c1"],
    ["00000000-0000-0000-0000-0000000000e2","emp2@test.local","Enzo Empleado","E0022","empleado","00000000-0000-0000-0000-0000000000c1"],
    ["00000000-0000-0000-0000-0000000000e3","emp3@test.local","Elena Empleada","E0023","empleado","00000000-0000-0000-0000-0000000000c1"],
    ["00000000-0000-0000-0000-0000000000e4","emp4@test.local","Emilio Empleado","E0024","empleado","00000000-0000-0000-0000-0000000000c2"],
    ["00000000-0000-0000-0000-0000000000e5","emp5@test.local","Elsa Empleada","E0025","empleado","00000000-0000-0000-0000-0000000000c2"],
    ["00000000-0000-0000-0000-0000000000e6","emp6@test.local","Esteban Empleado","E0026","empleado","00000000-0000-0000-0000-0000000000c2"]
  ]'::jsonb;
begin
  for u in select * from jsonb_array_elements(v_users) loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      (u.value->>0)::uuid, 'authenticated', 'authenticated',
      u.value->>1,
      extensions.crypt('Password123!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', u.value->>2, 'employee_code', u.value->>3, 'role', u.value->>4, 'center_id', u.value->>5),
      now(), now()
    )
    on conflict (id) do nothing;

    begin
      insert into auth.identities (provider, provider_id, user_id, identity_data, last_sign_in_at, created_at, updated_at)
      values ('email', u.value->>1, (u.value->>0)::uuid, jsonb_build_object('sub', u.value->>0, 'email', u.value->>1, 'email_verified', true), now(), now(), now())
      on conflict do nothing;
    exception when others then
      raise notice 'identity no insertado para %: %', u.value->>1, sqlerrm;
    end;
  end loop;
end $$;

-- ===== Equipos y miembros =====
insert into teams (id, name, center_id) values
  ('00000000-0000-0000-0000-0000000000d0', 'Equipo Operaciones Madrid', '00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-0000000000d1', 'Equipo Refino Cartagena', '00000000-0000-0000-0000-0000000000c2')
on conflict do nothing;

insert into team_members (team_id, user_id, role) values
  ('00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-0000000000b1', 'lider'),
  ('00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-0000000000b2', 'lider'),
  ('00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-0000000000e1', 'miembro'),
  ('00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-0000000000e2', 'miembro'),
  ('00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-0000000000e3', 'miembro'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b3', 'lider'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e4', 'miembro'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e5', 'miembro'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e6', 'miembro')
on conflict do nothing;

-- ===== Patrones rotativos y asignaciones =====
insert into shift_patterns (id, name, cycle_days, definition, color) values
  ('00000000-0000-0000-0000-0000000000d2', '4T-2N-2L', 8,
   '{"sequence":["T","T","T","T","N","N","L","L"],
     "shifts":{"T":{"start":"08:00","end":"16:00","label":"Mañana"},
               "N":{"start":"16:00","end":"00:00","label":"Tarde","overnight":true},
               "L":{"label":"Libre"}}}'::jsonb, '#FF8200'),
  ('00000000-0000-0000-0000-0000000000d3', '5M-2L', 7,
   '{"sequence":["M","M","M","M","M","L","L"],
     "shifts":{"M":{"start":"07:00","end":"15:00","label":"Mañana"},
               "L":{"label":"Libre"}}}'::jsonb, '#041E42')
on conflict do nothing;

insert into shift_assignments (id, pattern_id, team_id, start_date, rotation_offset) values
  ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000d0', current_date - 30, 0),
  ('00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000d1', current_date - 30, 3)
on conflict do nothing;

-- ===== Festivos (nacional + comunidad) =====
insert into holidays (name, date, scope, comunidad) values
  ('Año Nuevo', make_date(extract(year from current_date)::int, 1, 1), 'nacional', null),
  ('Viernes Santo', current_date + 150, 'nacional', null),
  ('Fiesta de la Comunidad de Madrid', current_date + 60, 'comunidad', 'madrid'),
  ('Día de la Región de Murcia', current_date + 75, 'comunidad', 'murcia')
on conflict do nothing;

-- ===== Vacaciones (muestra de estados) =====
insert into vacation_requests (id, user_id, type, start_date, end_date, days, status, reviewer_id, decided_at) values
  ('00000000-0000-0000-0000-0000000000de', '00000000-0000-0000-0000-0000000000e1', 'vacacion', current_date + 30, current_date + 34, 5, 'pendiente', null, null),
  ('00000000-0000-0000-0000-0000000000df', '00000000-0000-0000-0000-0000000000e2', 'vacacion', current_date + 10, current_date + 12, 3, 'aprobada', '00000000-0000-0000-0000-0000000000b1', current_date - 2),
  ('00000000-0000-0000-0000-0000000000e0', '00000000-0000-0000-0000-0000000000e4', 'permiso', current_date + 5, current_date + 5, 1, 'rechazada', '00000000-0000-0000-0000-0000000000b3', current_date - 1)
on conflict do nothing;

-- ===== Eventos corporativos =====
insert into corporate_events (id, title, description, starts_at, ends_at, all_day, created_by) values
  ('00000000-0000-0000-0000-0000000000d6', 'Jornada de seguridad', 'Charla anual de seguridad industrial', current_date + 20, current_date + 20, true, '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000d7', 'Reunión de equipo Madrid', 'Revisión trimestral', current_date + 7 + interval '9 hours', current_date + 7 + interval '10 hours', false, '00000000-0000-0000-0000-0000000000b1')
on conflict do nothing;

-- ===== Credenciales + registros de acceso de ejemplo =====
insert into access_credentials (id, user_id, kind, status, issued_by) values
  ('00000000-0000-0000-0000-0000000000d8', '00000000-0000-0000-0000-0000000000e1', 'qr', 'activa', '00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-0000000000d9', '00000000-0000-0000-0000-0000000000e1', 'qr', 'revocada', '00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-0000000000da', '00000000-0000-0000-0000-0000000000e4', 'qr', 'activa', '00000000-0000-0000-0000-0000000000b3')
on conflict do nothing;

insert into access_logs (credential_id, user_id, event, method, source, center_id, scanned_at)
select
  case when random() < 0.7 then '00000000-0000-0000-0000-0000000000d8'::uuid else '00000000-0000-0000-0000-0000000000da'::uuid end,
  case when random() < 0.7 then '00000000-0000-0000-0000-0000000000e1'::uuid else '00000000-0000-0000-0000-0000000000e4'::uuid end,
  case when s % 2 = 0 then 'entrada'::access_event else 'salida'::access_event end,
  'qr', 'manual',
  case when random() < 0.7 then '00000000-0000-0000-0000-0000000000c1'::uuid else '00000000-0000-0000-0000-0000000000c2'::uuid end,
  current_date - (s / 2) + (8 + (s % 9)) * interval '1 hour'
from generate_series(0, 59) s;

-- ===== Notificaciones =====
insert into notifications (id, user_id, type, title, body, read_at) values
  ('00000000-0000-0000-0000-0000000000db', '00000000-0000-0000-0000-0000000000e1', 'turno', 'Cambio de turno', 'Tu turno de mañana pasa a tarde el lunes', null),
  ('00000000-0000-0000-0000-0000000000dc', '00000000-0000-0000-0000-0000000000e1', 'corporativa', 'Jornada de seguridad', 'Inscripción abierta hasta el viernes', now()),
  ('00000000-0000-0000-0000-0000000000dd', '00000000-0000-0000-0000-0000000000e4', 'acceso', 'Credencial revocada', 'Se ha revocado tu credencial anterior', null)
on conflict do nothing;

-- ===== Normalización de columnas token de auth.users =====
-- GoTrue escanea confirmation_token/recovery_token/... como string no nullable:
-- un NULL provoca "Scan error ... converting NULL to string is unsupported" en login.
update auth.users set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, '')
where confirmation_token is null
   or recovery_token is null
   or email_change_token_new is null
   or email_change is null
   or email_change_token_current is null
   or phone_change is null
   or phone_change_token is null
   or reauthentication_token is null;

commit;
