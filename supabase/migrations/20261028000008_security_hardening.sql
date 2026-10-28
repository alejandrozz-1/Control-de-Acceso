-- 20261028000008 Endurecimiento tras advisors de seguridad
-- (advisors: ERROR security_definer_view + WARNs de EXECUTE público y search_path mutable)

-- Vista con invoker: aplica el RLS del usuario que consulta
drop view if exists public.mv_assistance_daily;
create view public.mv_assistance_daily with (security_invoker = true) as
select
  l.user_id,
  l.scanned_at::date as day,
  min(l.scanned_at) filter (where l.event = 'entrada') as first_in,
  max(l.scanned_at) filter (where l.event = 'salida') as last_out,
  count(*) filter (where l.event = 'entrada') as entries
from access_logs l
where l.event <> 'denegado'
group by l.user_id, l.scanned_at::date;

-- search_path fijo en función sin schema
alter function public.set_updated_at() set search_path = '';

-- Funciones internas de triggers: sin EXECUTE para clientes
revoke execute on function public.fn_audit() from public, anon, authenticated;
revoke execute on function public.fn_protect_profile() from public, anon, authenticated;
revoke execute on function public.fn_vacation_review() from public, anon, authenticated;
revoke execute on function public.fn_notify_credential_revoked() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.trg_regenerate_shift_entries() from public, anon, authenticated;
revoke execute on function public.trg_regenerate_member_entries() from public, anon, authenticated;
revoke execute on function public.fn_generate_shift_entries(date, date, uuid) from public, anon, authenticated;
grant execute on function public.fn_generate_shift_entries(date, date, uuid) to service_role;

-- Helpers de autorización: solo authenticated (las políticas los invocan); anon no
revoke execute on function public.fn_my_role() from public, anon;
revoke execute on function public.fn_is_admin() from public, anon;
revoke execute on function public.fn_is_staff() from public, anon;
revoke execute on function public.fn_leads_user(uuid) from public, anon;
revoke execute on function public.fn_shares_team(uuid) from public, anon;
revoke execute on function public.fn_is_team_leader(uuid) from public, anon;

-- Nota: persisten WARNs aceptados "authenticated_security_definer_function_executable"
-- sobre los helpers (fn_my_role, fn_is_admin, fn_is_staff, fn_leads_user, fn_shares_team,
-- fn_is_team_leader): DEBEN ser SECURITY DEFINER para evitar recursión de RLS y solo
-- devuelven el rol/relación del propio usuario autenticado. Riesgo aceptado y registrado.
