-- 037 미적용 환경에서 ip_hash만으로 차단을 등록할 수 있도록 합니다.
-- 기존 원본 IP 데이터는 보존하며, 037로 ip 컬럼이 제거된 환경에서는 건너뜁니다.
begin;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'blocked_ips'
      and column_name = 'ip'
  ) then
    alter table public.blocked_ips alter column ip drop not null;
  end if;
end;
$$;

notify pgrst, 'reload schema';
commit;
