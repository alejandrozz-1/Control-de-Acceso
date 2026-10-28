-- 20261028000002 Enumeraciones del dominio
do $$ begin create type user_role as enum ('empleado','responsable','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type member_role as enum ('miembro','lider'); exception when duplicate_object then null; end $$;
do $$ begin create type leave_type as enum ('vacacion','baja','permiso'); exception when duplicate_object then null; end $$;
do $$ begin create type request_status as enum ('pendiente','aprobada','rechazada','anulada'); exception when duplicate_object then null; end $$;
do $$ begin create type credential_kind as enum ('qr','temporal','nfc'); exception when duplicate_object then null; end $$;
do $$ begin create type credential_status as enum ('activa','revocada','caducada'); exception when duplicate_object then null; end $$;
do $$ begin create type access_event as enum ('entrada','salida','denegado'); exception when duplicate_object then null; end $$;
do $$ begin create type access_method as enum ('qr','temporal','nfc','manual'); exception when duplicate_object then null; end $$;
do $$ begin create type access_source as enum ('app','torno','manual'); exception when duplicate_object then null; end $$;
do $$ begin create type notification_type as enum ('turno','acceso','vacacion','corporativa','sistema'); exception when duplicate_object then null; end $$;
do $$ begin create type holiday_scope as enum ('nacional','comunidad','centro'); exception when duplicate_object then null; end $$;
