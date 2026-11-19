-- Video Blogs: a dedicated table with SEO / GEO / AEO fields, like the FAQ, Glossary and Q&A.
-- Each video is a YouTube video (vertical Short/Reel or a normal horizontal video) with its own page,
-- a timestamped transcript, an optional write-up, and everything search engines and AI assistants need.
--
-- Safe to run more than once. Access is SERVER ONLY: row level security is on and there are no public
-- policies. The website's own server reads and writes with its service key after checking the user's role.
-- Existing video posts are copied over later with the "Import from blog posts" button in the admin screen.

create table if not exists public.video_posts (
  id text primary key,
  slug text not null,
  title text not null,
  description text not null default '',              -- short plain-text summary shown on cards and in search
  format text not null default 'vertical',           -- vertical (9:16 Short/Reel) or horizontal (16:9)
  youtube_id text not null,                          -- the 11-character YouTube video id
  thumbnail_url text not null default '',            -- optional custom cover; empty = the YouTube thumbnail
  duration_seconds integer,
  upload_date date,                                  -- when it went live on YouTube
  category text not null default '',
  author_name text not null default '',
  author_credentials text not null default '',
  transcript text not null default '',               -- timestamped lines, e.g. "0:12 Welcome to..."
  content text not null default '',                  -- optional written article under the video (HTML)
  -- SEO / GEO / AEO
  short_answer text not null default '',
  key_takeaways jsonb not null default '[]'::jsonb,
  alternate_questions text[] not null default '{}',  -- questions this video answers
  sources jsonb not null default '[]'::jsonb,
  same_as text[] not null default '{}',
  related_videos text[] not null default '{}',
  reviewed_by text not null default '',
  last_reviewed date,
  meta_title text not null default '',
  meta_description text not null default '',
  focus_keyword text not null default '',
  secondary_keywords text[] not null default '{}',
  canonical_url text not null default '',
  og_image text not null default '',
  noindex boolean not null default false,
  featured boolean not null default false,
  status text not null default 'draft',
  source_blog_id text,                               -- set when imported from the old blog-post videos
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.video_posts drop constraint if exists video_posts_format_check;
alter table public.video_posts add constraint video_posts_format_check check (format in ('vertical', 'horizontal'));
alter table public.video_posts drop constraint if exists video_posts_status_check;
alter table public.video_posts add constraint video_posts_status_check check (status in ('draft', 'published'));
alter table public.video_posts drop constraint if exists video_posts_slug_format;
alter table public.video_posts add constraint video_posts_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
alter table public.video_posts drop constraint if exists video_posts_youtube_id_format;
alter table public.video_posts add constraint video_posts_youtube_id_format check (youtube_id ~ '^[A-Za-z0-9_-]{11}$');
alter table public.video_posts drop constraint if exists video_posts_duration_check;
alter table public.video_posts add constraint video_posts_duration_check check (duration_seconds is null or (duration_seconds >= 0 and duration_seconds <= 86400));

create unique index if not exists video_posts_slug_key on public.video_posts (slug);
create unique index if not exists video_posts_youtube_id_key on public.video_posts (youtube_id);
create index if not exists video_posts_status_idx on public.video_posts (status, upload_date desc);
create unique index if not exists video_posts_source_blog_key on public.video_posts (source_blog_id) where source_blog_id is not null;

-- A clean, unique web address for every video (lowercase, hyphenated, max 60 characters)
create or replace function public.video_set_slug() returns trigger language plpgsql as $$
declare base text; raw text; candidate text; n int := 1;
begin
  if new.slug is null or new.slug = '' then
    raw := trim(both '-' from regexp_replace(lower(new.title), '[^a-z0-9]+', '-', 'g'));
    if length(raw) > 60 then raw := regexp_replace(left(raw, 60), '-[^-]*$', ''); end if;
    base := coalesce(nullif(trim(both '-' from raw), ''), 'video');
    candidate := base;
    while exists (select 1 from public.video_posts where slug = candidate) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end $$;
drop trigger if exists video_set_slug_trg on public.video_posts;
create trigger video_set_slug_trg before insert on public.video_posts
  for each row execute function public.video_set_slug();

-- Keeps timestamps honest: published_at is stamped the first time a video goes live
create or replace function public.video_touch() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
  return new;
end $$;
drop trigger if exists video_touch_trg on public.video_posts;
create trigger video_touch_trg before insert or update on public.video_posts
  for each row execute function public.video_touch();

-- Server only: RLS on, and deliberately NO policies for the public browser key.
alter table public.video_posts enable row level security;
