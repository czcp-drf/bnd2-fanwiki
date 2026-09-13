-- blocked_ips의 원본 IP 컬럼 제거
-- migration 036 적용 후 기존 차단 데이터를 확인하고 실행한다.
begin;

alter table public.blocked_ips
  alter column ip_hash set not null;

alter table public.blocked_ips
  drop column if exists ip;

notify pgrst, 'reload schema';
commit;
