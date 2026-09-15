begin;

alter table public.characters
  add column if not exists is_name_pending boolean not null default false;

-- 기존 '미정' 레코드는 기존 입력 규칙에 따라 미정 상태로 백필합니다.
update public.characters
set is_name_pending = true
where name = '미정' and is_name_pending = false;

drop function if exists public.save_character(uuid, text, text, text, uuid, text);
create or replace function public.save_character(
  p_character_id uuid, p_name text, p_is_name_pending boolean,
  p_job text, p_status text, p_org_id uuid, p_role text
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_name is null or btrim(p_name) = '' or p_status is null or p_status not in ('active', 'dead', 'retired', 'hiatus') then
    raise exception 'Invalid character input' using errcode = '22023';
  end if;
  perform 1 from public.characters where id = p_character_id for update;
  if not found then
    raise exception 'Character not found' using errcode = 'P0002';
  end if;
  update public.characters
  set name = btrim(p_name), is_name_pending = coalesce(p_is_name_pending, false),
      job = nullif(btrim(p_job), ''), status = p_status
  where id = p_character_id;
  if p_org_id is not null then
    insert into public.organization_members (character_id, organization_id, role, is_primary, left_at)
    values (p_character_id, p_org_id, nullif(btrim(p_role), ''), true, null)
    on conflict (character_id, organization_id) do update
    set role = excluded.role, is_primary = true, left_at = null;
  end if;
  delete from public.organization_members
  where character_id = p_character_id and is_primary = true
    and (p_org_id is null or organization_id <> p_org_id);
end;
$$;

drop function if exists public.create_character_with_membership(text, uuid, text, text, uuid, text);
create or replace function public.create_character_with_membership(
  p_name text, p_is_name_pending boolean, p_streamer_id uuid, p_job text, p_status text,
  p_org_id uuid, p_role text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_character_id uuid;
begin
  if p_status is null or p_status not in ('active', 'dead', 'retired', 'hiatus') then
    raise exception 'Invalid character status' using errcode = '22023';
  end if;
  insert into public.characters (name, is_name_pending, streamer_id, job, status)
  values (coalesce(nullif(btrim(p_name), ''), '미정'), coalesce(p_is_name_pending, false), p_streamer_id, nullif(btrim(p_job), ''), p_status)
  returning id into v_character_id;
  if p_org_id is not null then
    insert into public.organization_members (character_id, organization_id, role, is_primary)
    values (v_character_id, p_org_id, nullif(btrim(p_role), ''), true);
  end if;
  return v_character_id;
end;
$$;

drop function if exists public.create_streamer_with_character(text, text, text);
create or replace function public.create_streamer_with_character(
  p_channel_id text, p_display_name text, p_profile_image_url text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_streamer_id uuid;
begin
  if p_channel_id is null or p_channel_id !~ '^[a-fA-F0-9]{32}$'
    or p_display_name is null or btrim(p_display_name) = '' then
    raise exception 'Invalid streamer input' using errcode = '22023';
  end if;
  insert into public.streamers (chzzk_channel_id, display_name, profile_image_url, is_active)
  values (p_channel_id, btrim(p_display_name), nullif(btrim(p_profile_image_url), ''), true)
  returning id into v_streamer_id;
  insert into public.characters (name, is_name_pending, streamer_id, status)
  values ('미정', true, v_streamer_id, 'active');
  return v_streamer_id;
end;
$$;

revoke all on function public.save_character(uuid, text, boolean, text, text, uuid, text) from public, anon, authenticated;
revoke all on function public.create_character_with_membership(text, boolean, uuid, text, text, uuid, text) from public, anon, authenticated;
revoke all on function public.create_streamer_with_character(text, text, text) from public, anon, authenticated;
grant execute on function public.save_character(uuid, text, boolean, text, text, uuid, text) to service_role;
grant execute on function public.create_character_with_membership(text, boolean, uuid, text, text, uuid, text) to service_role;
grant execute on function public.create_streamer_with_character(text, text, text) to service_role;

notify pgrst, 'reload schema';
commit;
