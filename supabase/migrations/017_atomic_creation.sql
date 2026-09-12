begin;

create or replace function public.create_character_with_membership(
  p_name text, p_streamer_id uuid, p_job text, p_status text,
  p_org_id uuid, p_role text
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_character_id uuid;
begin
  if p_status is null or p_status not in ('active', 'dead', 'retired', 'hiatus') then
    raise exception 'Invalid character status' using errcode = '22023';
  end if;
  insert into public.characters (name, streamer_id, job, status)
  values (coalesce(nullif(btrim(p_name), ''), '미정'), p_streamer_id, nullif(btrim(p_job), ''), p_status)
  returning id into v_character_id;

  if p_org_id is not null then
    insert into public.organization_members (character_id, organization_id, role, is_primary)
    values (v_character_id, p_org_id, nullif(btrim(p_role), ''), true);
  end if;
  return v_character_id;
end;
$$;

create or replace function public.create_streamer_with_character(
  p_channel_id text, p_display_name text, p_profile_image_url text
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_streamer_id uuid;
begin
  if p_channel_id is null or p_channel_id !~ '^[a-fA-F0-9]{32}$'
    or p_display_name is null or btrim(p_display_name) = '' then
    raise exception 'Invalid streamer input' using errcode = '22023';
  end if;
  insert into public.streamers (chzzk_channel_id, display_name, profile_image_url, is_active)
  values (p_channel_id, btrim(p_display_name), nullif(btrim(p_profile_image_url), ''), true)
  returning id into v_streamer_id;

  insert into public.characters (name, streamer_id, status)
  values ('미정', v_streamer_id, 'active');
  return v_streamer_id;
end;
$$;

revoke all on function public.create_character_with_membership(text,uuid,text,text,uuid,text) from public, anon, authenticated;
revoke all on function public.create_streamer_with_character(text,text,text) from public, anon, authenticated;
grant execute on function public.create_character_with_membership(text,uuid,text,text,uuid,text) to service_role;
grant execute on function public.create_streamer_with_character(text,text,text) to service_role;

notify pgrst, 'reload schema';
commit;
