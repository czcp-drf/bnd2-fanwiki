-- Bonstagram: 기존 캐릭터당 하나의 SNS 프로필
begin;

create table public.bonstagram_profiles (
  character_id uuid primary key references public.characters(id) on delete cascade,
  profile_name text not null,
  avatar_url   text,
  bio          text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint bonstagram_profile_name_length
    check (char_length(btrim(profile_name)) between 1 and 40),
  constraint bonstagram_bio_length
    check (bio is null or char_length(bio) <= 150)
);

create trigger bonstagram_profiles_updated_at
  before update on public.bonstagram_profiles
  for each row execute function public.update_updated_at();

alter table public.bonstagram_profiles enable row level security;

create policy "public read Bonstagram profiles"
  on public.bonstagram_profiles for select using (true);

comment on table public.bonstagram_profiles is 'Bonstagram SNS profile; one profile per character';
comment on column public.bonstagram_profiles.profile_name is 'Public display nickname; Korean and English allowed';

notify pgrst, 'reload schema';
commit;
