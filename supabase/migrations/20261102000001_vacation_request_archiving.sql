-- Keep completed requests available in each employee's historical view.
alter table public.vacation_requests
  add column if not exists archived_at timestamptz;

create index if not exists idx_vacation_user_archive_created
  on public.vacation_requests(user_id, archived_at, created_at desc);