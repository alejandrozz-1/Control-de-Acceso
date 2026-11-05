-- GoTrue guarda app_metadata DESPUÉS del INSERT (supabase/auth#1280): en el trigger,
-- user_creation nunca está visible en altas vía API, así que `not v_seed_user` era NULL y el
-- INSERT revienta con 23502 (alta de usuarios rota). El estado real (pendiente_activacion,
-- rol, centro) lo fija la función admin-users vía profiles.update tras el createUser.
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
    coalesce(not v_seed_user, false)
  )
  on conflict (id) do nothing;
  return new;
end $$;
