-- 사건 아카이브에 재미있는 클립을 별도로 분류하기 위한 하이라이트 유형 추가
begin;

do $$
declare
  constraint_name text;
begin
  select con.conname
    into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'events'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%war%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.events drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.events
  add constraint events_type_check
  check (type in ('war', 'crime', 'political', 'social', 'accident', 'highlight', 'other'));

comment on column public.events.type is 'Event type: war, crime, political, social, accident, highlight, or other';

notify pgrst, 'reload schema';
commit;
