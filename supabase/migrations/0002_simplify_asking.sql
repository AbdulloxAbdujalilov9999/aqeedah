-- Asking without accounts: name required, phone/Telegram username optional, track by question id only.
-- Also marks questions that admins add themselves (source = 'admin').

alter table public.questions add column if not exists asker_phone text;
alter table public.questions add column if not exists source text not null default 'public' check (source in ('public','admin'));

-- New public submit: name required, phone/username optional, returns only the question id.
create or replace function public.ask_question(
  p_lang text, p_topic_id int, p_body text, p_name text, p_phone text, p_username text,
  p_publish_consent boolean, p_urgent boolean
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_id bigint; v_phone text := nullif(regexp_replace(coalesce(p_phone,''), '[^0-9+]', '', 'g'), '');
        v_user text := nullif(lower(regexp_replace(trim(coalesce(p_username,'')), '^@', '')), '');
begin
  if nullif(trim(coalesce(p_name,'')),'') is null then raise exception 'name_required'; end if;
  if not coalesce(p_publish_consent, true) and v_phone is null and v_user is null then
    raise exception 'contact_required';
  end if;
  if (v_phone is not null or v_user is not null) and (
    select count(*) from public.questions q
    where q.created_at > now() - interval '24 hours'
      and ((v_phone is not null and q.asker_phone = v_phone) or (v_user is not null and lower(q.contact_telegram) = v_user))
  ) >= 3 then
    raise exception 'daily_limit';
  end if;
  insert into public.questions (lang, topic_id, body, asker_name, anonymous, asker_phone, contact_telegram, publish_consent, urgent)
  values (p_lang, p_topic_id, trim(p_body), left(trim(p_name), 80), false, v_phone, v_user, coalesce(p_publish_consent, true), coalesce(p_urgent, false))
  returning id into v_id;
  return v_id;
end $$;

-- Track by id only: status and dates, never the question text or private answers.
create or replace function public.question_status(p_id bigint)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', q.id, 'status', q.status, 'created_at', q.created_at, 'publish_consent', q.publish_consent,
    'decline_reason', q.decline_reason,
    'events', coalesce((select jsonb_agg(jsonb_build_object('status', e.status, 'at', e.created_at) order by e.created_at)
                        from public.question_events e where e.question_id = q.id), '[]'::jsonb),
    'answer_question_id', case when q.publish_consent or q.duplicate_of is not null then
        (select a.question_id from public.answers a
           where a.question_id = coalesce(q.duplicate_of, q.id) and a.status = 'published'
             and public.question_is_public(a.question_id) limit 1) end)
  from public.questions q where q.id = p_id
$$;

grant execute on function public.ask_question(text,int,text,text,text,text,boolean,boolean), public.question_status(bigint) to anon, authenticated;
revoke execute on function public.submit_question(text,int,text,boolean,text,boolean,text,text,boolean) from anon, authenticated, public;
revoke execute on function public.track_question(text,text) from anon, authenticated, public;
