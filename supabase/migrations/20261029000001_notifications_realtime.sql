-- T-017: notificaciones en tiempo real (badge + lista se refrescan al llegar INSERT).
do $$ begin
  alter publication supabase_realtime add table notifications;
exception when duplicate_object then null; end $$;

-- Índice para el badge (unread por usuario)
create index if not exists idx_notifications_unread on notifications(user_id) where read_at is null;
