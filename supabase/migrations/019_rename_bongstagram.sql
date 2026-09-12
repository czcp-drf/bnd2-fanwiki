-- Bongstagram 명칭 통일: 이미 적용된 018의 객체를 rename한다.
begin;

alter table public.bonstagram_profiles
  rename to bongstagram_profiles;

alter table public.bongstagram_profiles
  rename constraint bonstagram_profile_name_length
  to bongstagram_profile_name_length;

alter table public.bongstagram_profiles
  rename constraint bonstagram_bio_length
  to bongstagram_bio_length;

alter trigger bonstagram_profiles_updated_at
  on public.bongstagram_profiles
  rename to bongstagram_profiles_updated_at;

alter policy "public read Bonstagram profiles"
  on public.bongstagram_profiles
  rename to "public read Bongstagram profiles";

comment on table public.bongstagram_profiles is 'Bongstagram SNS profile; one profile per character';

notify pgrst, 'reload schema';
commit;
