-- 20261028000006 Notificaciones, suscripciones push y configuración
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type notification_type not null default 'sistema',
  title text not null,
  body text,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications(user_id, read_at nulls first, created_at desc);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_push_subs_user on push_subscriptions(user_id);

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at_app_settings on app_settings;
create trigger set_updated_at_app_settings before update on app_settings
  for each row execute function public.set_updated_at();

insert into app_settings (key, value) values
  ('temporal_code_ttl_seconds', '300'::jsonb),
  ('qr_hmac_secret_rotated_at', to_jsonb(extract(epoch from now())::text))
on conflict (key) do nothing;
