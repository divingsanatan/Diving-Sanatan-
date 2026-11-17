-- Q&A Board: real, shared storage (it used to live only in each visitor's browser).
-- Visitors ask questions (held for staff approval), healers and staff write the official answer,
-- and every answered question gets its own SEO / GEO / AEO ready page, like the FAQ and Glossary.
--
-- Safe to run more than once. Access is SERVER ONLY: row level security is on and there are no
-- public policies, so nobody can read or write these tables with the public browser key. The website's
-- own server reads and writes them with its service key after checking the signed-in user's role.
-- (This keeps asker identities and private moderation notes from ever leaking.)

create table if not exists public.qa_questions (
  id text primary key,
  slug text not null,
  title text not null,
  description text not null default '',
  category text not null default '',
  source text not null default 'member',            -- member = asked by a visitor, staff = written by the team
  asked_by_profile_id text,                           -- private: never shown publicly
  asked_by_name text not null default '',             -- public display name, e.g. "Priya S." (empty = anonymous)
  anonymous boolean not null default false,
  status text not null default 'pending',             -- pending -> published (or rejected)
  moderation_note text not null default '',           -- private note for staff
  -- the official answer
  answer text not null default '',
  short_answer text not null default '',
  answerer_name text not null default '',
  answerer_role text not null default '',
  answerer_credentials text not null default '',
  answerer_image text not null default '',
  practitioner_id text,
  answered_at timestamptz,
  -- SEO / GEO / AEO
  key_takeaways jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  same_as text[] not null default '{}',
  related_questions text[] not null default '{}',
  alternate_questions text[] not null default '{}',
  reviewed_by text not null default '',
  last_reviewed date,
  meta_title text not null default '',
  meta_description text not null default '',
  focus_keyword text not null default '',
  secondary_keywords text[] not null default '{}',
  canonical_url text not null default '',
  og_image text not null default '',
  noindex boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qa_comments (
  id text primary key,
  question_id text not null references public.qa_questions(id) on delete cascade,
  parent_id text references public.qa_comments(id) on delete cascade,
  profile_id text,                                    -- private: never shown publicly
  author_name text not null default '',
  author_role text not null default 'member',         -- member | healer | staff
  body text not null,
  status text not null default 'pending',             -- pending -> published (or rejected)
  created_at timestamptz not null default now()
);

-- Rules the data must always follow
alter table public.qa_questions drop constraint if exists qa_questions_status_check;
alter table public.qa_questions add constraint qa_questions_status_check check (status in ('pending', 'published', 'rejected'));
alter table public.qa_questions drop constraint if exists qa_questions_source_check;
alter table public.qa_questions add constraint qa_questions_source_check check (source in ('member', 'staff'));
alter table public.qa_questions drop constraint if exists qa_questions_slug_format;
alter table public.qa_questions add constraint qa_questions_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
alter table public.qa_comments drop constraint if exists qa_comments_status_check;
alter table public.qa_comments add constraint qa_comments_status_check check (status in ('pending', 'published', 'rejected'));
alter table public.qa_comments drop constraint if exists qa_comments_role_check;
alter table public.qa_comments add constraint qa_comments_role_check check (author_role in ('member', 'healer', 'staff'));

create unique index if not exists qa_questions_slug_key on public.qa_questions (slug);
create index if not exists qa_questions_status_idx on public.qa_questions (status, answered_at desc);
create index if not exists qa_questions_asker_idx on public.qa_questions (asked_by_profile_id, created_at desc);
create index if not exists qa_comments_question_idx on public.qa_comments (question_id, status, created_at);
create index if not exists qa_comments_status_idx on public.qa_comments (status, created_at desc);
create index if not exists qa_comments_author_idx on public.qa_comments (profile_id, created_at desc);

-- A clean, unique web address for every question (lowercase, hyphenated, max 60 characters)
create or replace function public.qa_set_slug() returns trigger language plpgsql as $$
declare base text; raw text; candidate text; n int := 1;
begin
  if new.slug is null or new.slug = '' then
    raw := trim(both '-' from regexp_replace(lower(new.title), '[^a-z0-9]+', '-', 'g'));
    if length(raw) > 60 then raw := regexp_replace(left(raw, 60), '-[^-]*$', ''); end if;
    base := coalesce(nullif(trim(both '-' from raw), ''), 'question');
    candidate := base;
    while exists (select 1 from public.qa_questions where slug = candidate) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end $$;
drop trigger if exists qa_set_slug_trg on public.qa_questions;
create trigger qa_set_slug_trg before insert on public.qa_questions
  for each row execute function public.qa_set_slug();

-- Keeps timestamps honest: published_at is stamped the first time a question goes live
create or replace function public.qa_touch() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
  return new;
end $$;
drop trigger if exists qa_touch_trg on public.qa_questions;
create trigger qa_touch_trg before insert or update on public.qa_questions
  for each row execute function public.qa_touch();

-- Server only: RLS on, and deliberately NO policies for the public browser key.
alter table public.qa_questions enable row level security;
alter table public.qa_comments enable row level security;
