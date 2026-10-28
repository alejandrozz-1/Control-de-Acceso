-- Datos simulados ricos para la vista Calendario (T-015/T-031).
-- Idempotente: todo con UUID fijo + on conflict do nothing.
-- shortcut: festivos 2026 peninsulares a mano; añadir tabla de códigos INE si se necesita multi-región.

-- ===== Festivos nacionales 2026 =====
insert into holidays (name, date, scope, comunidad) values
  ('Año Nuevo', '2026-01-01', 'nacional', null),
  ('Epifanía del Señor', '2026-01-06', 'nacional', null),
  ('Jueves Santo', '2026-04-02', 'nacional', null),
  ('Viernes Santo', '2026-04-03', 'nacional', null),
  ('Fiesta del Trabajo', '2026-05-01', 'nacional', null),
  ('Asunción de la Virgen', '2026-08-15', 'nacional', null),
  ('Fiesta Nacional de España', '2026-10-12', 'nacional', null),
  ('Día de la Hispanidad', '2026-11-01', 'nacional', null),
  ('Constitución Española', '2026-12-06', 'nacional', null),
  ('Inmaculada Concepción', '2026-12-08', 'nacional', null),
  ('Navidad', '2026-12-25', 'nacional', null)
on conflict do nothing;

-- ===== Festivos comunidad de Madrid 2026 =====
insert into holidays (name, date, scope, comunidad) values
  ('Día de la Comunidad de Madrid', '2026-05-02', 'comunidad', 'madrid'),
  ('San Isidro Labrador', '2026-05-15', 'comunidad', 'madrid')
on conflict do nothing;

-- ===== Festivos Región de Murcia 2026 =====
insert into holidays (name, date, scope, comunidad) values
  ('Día de la Región de Murcia', '2026-06-09', 'comunidad', 'murcia')
on conflict do nothing;

-- ===== Vacaciones repartidas por usuarios y meses (estados variados) =====
insert into vacation_requests (id, user_id, type, start_date, end_date, days, status, reviewer_id, decided_at) values
  -- emp1 (e1): agosto aprobado + Semana Santa pendiente
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-0000000000e1', 'vacacion', '2026-08-03', '2026-08-14', 10, 'aprobada', '00000000-0000-0000-0000-0000000000b1', '2026-06-10'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-0000000000e1', 'vacacion', '2026-03-30', '2026-04-02', 4, 'pendiente', null, null),
  -- emp2 (e2): Navidad aprobada + puente de mayo rechazado
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-0000000000e2', 'vacacion', '2026-12-21', '2026-12-31', 9, 'aprobada', '00000000-0000-0000-0000-0000000000b1', '2026-09-01'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-0000000000e2', 'vacacion', '2026-05-04', '2026-05-05', 2, 'rechazada', '00000000-0000-0000-0000-0000000000b1', '2026-04-20'),
  -- emp3 (e3): verano + día personal
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-0000000000e3', 'vacacion', '2026-07-27', '2026-08-07', 10, 'aprobada', '00000000-0000-0000-0000-0000000000b2', '2026-05-15'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-0000000000e3', 'permiso', '2026-11-06', '2026-11-06', 1, 'pendiente', null, null),
  -- emp4 (e4) y emp5 (e5) en Cartagena
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-0000000000e4', 'vacacion', '2026-06-08', '2026-06-12', 5, 'aprobada', '00000000-0000-0000-0000-0000000000b3', '2026-05-02'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-0000000000e5', 'vacacion', '2026-08-24', '2026-09-04', 10, 'pendiente', null, null),
  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-0000000000e6', 'vacacion', '2026-02-09', '2026-02-13', 5, 'aprobada', '00000000-0000-0000-0000-0000000000b3', '2026-01-20')
on conflict do nothing;

-- ===== Eventos corporativos =====
insert into corporate_events (id, title, description, starts_at, ends_at, all_day, created_by) values
  ('00000000-0000-0000-0000-000000000111', 'Simulacro de emergencia', 'Simulacro anual de evacuación en todas las instalaciones', '2026-02-18 10:00', '2026-02-18 12:00', false, '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000112', 'Revisión trimestral de accesos', 'Auditoría de credenciales y permisos con seguridad', '2026-03-16 09:00', '2026-03-16 11:00', false, '00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-000000000113', 'Día del empleado', 'Actividades y comida en el centro de Madrid', '2026-05-29', '2026-05-29', true, '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000114', 'Formación en prevención', 'Curso obligatorio de PRL (turno de mañana)', '2026-07-10 08:00', '2026-07-10 14:00', false, '00000000-0000-0000-0000-0000000000b3'),
  ('00000000-0000-0000-0000-000000000115', 'Cierre operativo navideño', 'Instalaciones en modo reducido', '2026-12-24', '2026-12-26', true, '00000000-0000-0000-0000-0000000000a1')
on conflict do nothing;
