create or replace function public.fn_issue_temporal(p_user_id uuid, p_ttl_seconds int default 60)
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
