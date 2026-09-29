alter table public.organizations
  add column if not exists previous_names text[];

comment on column public.organizations.previous_names is '조직의 이전 명칭 목록';
