-- Aqeedah database schema (Supabase / Postgres 17).
-- Applied to project arejatrbitloplmvvsxq on 2026-10-26. Kept here as the record of the schema.

create extension if not exists pg_trgm with schema extensions;

-- Uzbek search normalizer: Cyrillic -> Latin, lowercase, apostrophes dropped,
-- so "намоз" = "Namoz" and "ro'za" = "roʻza" = "roza" = "рўза".
create or replace function public.uz_norm(t text) returns text
language plpgsql immutable parallel safe set search_path = '' as $$
declare s text := lower(coalesce(t,''));
begin
  s := replace(s,'ш','sh'); s := replace(s,'ч','ch'); s := replace(s,'ё','yo');
  s := replace(s,'ю','yu'); s := replace(s,'я','ya'); s := replace(s,'ц','ts');
  s := replace(s,'щ','sh');
  s := translate(s, 'абвгдежзийклмнопрстуфхэыўғқҳ', 'abvgdejziyklmnoprstufxeiogqh');
  s := translate(s, 'ъь''‘’ʻʼ`´', '');
  s := regexp_replace(s, '\s+', ' ', 'g');
  return s;
end $$;

create type public.staff_role as enum ('moderator','scholar','reviewer','translator','admin');
create type public.q_status as enum ('received','assigned','answering','in_review','answered','declined','duplicate');
create type public.a_status as enum ('draft','in_review','returned','published');

create table public.topics (
  id serial primary key, slug text unique not null, name_uz text not null, name_en text not null,
  intro_uz text, intro_en text, sort int not null default 100
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, role public.staff_role, title_uz text, title_en text, bio_uz text, bio_en text,
  credentials text, is_public boolean not null default false, created_at timestamptz not null default now()
);

create table public.questions (
  id bigint generated always as identity (start with 1001) primary key,
  number text generated always as ('AQ-' || id::text) stored,
  track_code text not null default upper(substr(md5(gen_random_uuid()::text),1,6)),
  topic_id int references public.topics(id),
  lang text not null check (lang in ('uz','en')),
  body text not null check (char_length(body) between 15 and 4000),
  asker_name text, anonymous boolean not null default true, publish_consent boolean not null default true,
  contact_email text, contact_telegram text, urgent boolean not null default false,
  status public.q_status not null default 'received',
  assigned_to uuid references public.profiles(id), duplicate_of bigint references public.questions(id),
  decline_reason text, staff_note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.questions(status);

create table public.question_events (
  id bigint generated always as identity primary key,
  question_id bigint not null references public.questions(id) on delete cascade,
  status public.q_status not null, note text, actor uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index on public.question_events(question_id);

-- One row per question per language; the original has is_translation = false.
create table public.answers (
  id bigint generated always as identity primary key,
  question_id bigint not null references public.questions(id) on delete cascade,
  lang text not null check (lang in ('uz','en')), is_translation boolean not null default false,
  title text not null, question_text text not null, short_answer text not null, body text not null default '',
  madhhab text not null default 'hanafi',
  author_id uuid references public.profiles(id), reviewer_id uuid references public.profiles(id),
  translator_id uuid references public.profiles(id),
  status public.a_status not null default 'draft', review_note text, views int not null default 0,
  published_at timestamptz, updated_at timestamptz not null default now(),
  search_doc tsvector generated always as (
    setweight(to_tsvector('simple', public.uz_norm(title)), 'A') ||
    setweight(to_tsvector('simple', public.uz_norm(question_text || ' ' || short_answer)), 'B') ||
    setweight(to_tsvector('simple', public.uz_norm(body)), 'C')
  ) stored,
  unique (question_id, lang)
);
create index answers_search_idx on public.answers using gin (search_doc);
create index answers_title_trgm on public.answers using gin (public.uz_norm(title) extensions.gin_trgm_ops);
create index on public.answers(status, published_at desc);

-- Role helpers
create or replace function public.my_role() returns public.staff_role
language sql stable security definer set search_path = '' as $$ select role from public.profiles where id = auth.uid() $$;
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role is not null) $$;
create or replace function public.question_is_public(p_id bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select publish_consent from public.questions where id = p_id), false) $$;

-- New accounts get a profile; the very first account becomes admin.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)),
          case when not exists (select 1 from public.profiles where role = 'admin') then 'admin'::public.staff_role end);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.log_question_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.question_events (question_id, status, actor) values (new.id, new.status, auth.uid());
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger questions_status_log_ins after insert on public.questions for each row execute function public.log_question_status();
create trigger questions_status_log_upd before update on public.questions for each row execute function public.log_question_status();

create or replace function public.clear_review_note() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'published' then new.review_note := null; end if;
  new.updated_at := now();
  return new;
end $$;
create trigger answers_before_write before insert or update on public.answers for each row execute function public.clear_review_note();

-- Row level security
alter table public.topics enable row level security;
alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.question_events enable row level security;
alter table public.answers enable row level security;

create policy topics_read on public.topics for select using (true);
create policy topics_admin on public.topics for all to authenticated using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
create policy profiles_read_public on public.profiles for select using (is_public and role is not null);
create policy profiles_read_self on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid())
  with check (id = auth.uid() and role is not distinct from public.my_role());
create policy profiles_admin on public.profiles for update to authenticated using (public.my_role() = 'admin') with check (true);
create policy questions_staff on public.questions for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy events_staff on public.question_events for select to authenticated using (public.is_staff());
create policy answers_public on public.answers for select using (status = 'published' and public.question_is_public(question_id));
create policy answers_staff on public.answers for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Public read models (definer views over safe columns)
create view public.public_answers as
  select a.*, q.topic_id, q.created_at as asked_at
  from public.answers a join public.questions q on q.id = a.question_id
  where a.status = 'published' and q.publish_consent;
create view public.staff_bylines as
  select id, full_name, role, title_uz, title_en, bio_uz, bio_en, credentials, is_public
  from public.profiles where role is not null;
grant select on public.public_answers, public.staff_bylines to anon, authenticated;

-- Public RPCs: askers never read the questions table directly.
create or replace function public.submit_question(
  p_lang text, p_topic_id int, p_body text, p_anonymous boolean, p_asker_name text,
  p_publish_consent boolean, p_contact_email text, p_contact_telegram text, p_urgent boolean
) returns table (number text, track_code text)
language plpgsql security definer set search_path = '' as $$
declare r public.questions;
begin
  if coalesce(nullif(trim(p_contact_email),''), nullif(trim(p_contact_telegram),'')) is not null and exists (
    select 1 from public.questions q
    where q.created_at > now() - interval '24 hours'
      and ((nullif(trim(p_contact_email),'') is not null and lower(q.contact_email) = lower(trim(p_contact_email)))
        or (nullif(trim(p_contact_telegram),'') is not null and lower(q.contact_telegram) = lower(trim(p_contact_telegram))))
  ) then raise exception 'daily_limit'; end if;
  insert into public.questions (lang, topic_id, body, anonymous, asker_name, publish_consent, contact_email, contact_telegram, urgent)
  values (p_lang, p_topic_id, trim(p_body), coalesce(p_anonymous,true), nullif(trim(p_asker_name),''),
          coalesce(p_publish_consent,true), nullif(trim(p_contact_email),''), nullif(trim(p_contact_telegram),''), coalesce(p_urgent,false))
  returning * into r;
  return query select r.number, r.track_code;
end $$;

create or replace function public.track_question(p_number text, p_code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'number', q.number, 'status', q.status, 'body', q.body, 'lang', q.lang, 'created_at', q.created_at,
    'decline_reason', q.decline_reason, 'duplicate_of', q.duplicate_of,
    'topic', (select jsonb_build_object('name_uz', t.name_uz, 'name_en', t.name_en) from public.topics t where t.id = q.topic_id),
    'events', coalesce((select jsonb_agg(jsonb_build_object('status', e.status, 'at', e.created_at) order by e.created_at)
                        from public.question_events e where e.question_id = q.id), '[]'::jsonb),
    'answer_question_id', (select a.question_id from public.answers a where a.question_id = coalesce(q.duplicate_of, q.id) and a.status = 'published' limit 1),
    'private_answer', case when q.status = 'answered' and not q.publish_consent then
        (select jsonb_build_object('title', a.title, 'short_answer', a.short_answer, 'body', a.body)
           from public.answers a where a.question_id = q.id and a.status = 'published' and not a.is_translation limit 1) end)
  from public.questions q
  where upper(q.number) = upper(trim(p_number)) and q.track_code = upper(trim(p_code))
$$;

create or replace function public.search_answers(p_q text, p_lang text default null, p_limit int default 20)
returns setof public.public_answers language sql stable set search_path = '' as $$
  select pa.* from public.public_answers pa
  where (p_lang is null or pa.lang = p_lang)
    and (pa.search_doc @@ plainto_tsquery('simple', public.uz_norm(p_q))
         or extensions.similarity(public.uz_norm(pa.title), public.uz_norm(p_q)) > 0.25)
  order by ts_rank(pa.search_doc, plainto_tsquery('simple', public.uz_norm(p_q))) desc,
           extensions.similarity(public.uz_norm(pa.title), public.uz_norm(p_q)) desc
  limit p_limit
$$;

create or replace function public.similar_questions(p_q text, p_limit int default 4)
returns table (question_id bigint, lang text, title text) language sql stable set search_path = '' as $$
  select pa.question_id, pa.lang, pa.title from public.public_answers pa
  where pa.search_doc @@ to_tsquery('simple', coalesce(nullif(array_to_string(array(
          select quote_literal(w) || ':*' from regexp_split_to_table(public.uz_norm(p_q), '[^a-z0-9]+') w
          where length(w) > 3 limit 12), ' | '), ''), 'zzzzzz'))
     or extensions.similarity(public.uz_norm(pa.title), public.uz_norm(p_q)) > 0.2
  order by extensions.similarity(public.uz_norm(pa.title || ' ' || pa.question_text), public.uz_norm(p_q)) desc
  limit p_limit
$$;

create or replace function public.bump_views(p_question_id bigint)
returns void language sql security definer set search_path = '' as $$
  update public.answers set views = views + 1 where question_id = p_question_id and status = 'published'
$$;

revoke execute on function public.handle_new_user(), public.log_question_status(), public.clear_review_note() from public, anon, authenticated;
revoke execute on function public.my_role(), public.is_staff() from public, anon;
grant execute on function public.my_role(), public.is_staff() to authenticated;
grant execute on function public.submit_question, public.track_question, public.search_answers, public.similar_questions,
  public.bump_views, public.uz_norm, public.question_is_public to anon, authenticated;

-- Only admins may change anyone's role or public flag (checked before the update applies).
create or replace function public.guard_profile_role() returns trigger
language plpgsql security definer set search_path = '' as $$
declare caller_role public.staff_role;
begin
  if auth.uid() is null then return new; end if;
  if new.role is distinct from old.role or new.is_public is distinct from old.is_public then
    select role into caller_role from public.profiles where id = auth.uid();
    if caller_role is distinct from 'admin' then raise exception 'only admins can change roles'; end if;
    if new.id = auth.uid() and new.role is distinct from old.role then raise exception 'admins cannot change their own role'; end if;
  end if;
  return new;
end $$;
revoke execute on function public.guard_profile_role() from public, anon, authenticated;
create trigger profiles_guard_role before update on public.profiles for each row execute function public.guard_profile_role();
