-- FAQ SEO / GEO / AEO fields. Purely additive: every existing FAQ keeps working.
-- Mirrors 20261103000000_glossary_seo.sql (each FAQ gets its own page, slug, status and SEO fields).
alter table public.faqs
  add column if not exists slug text,
  add column if not exists status text not null default 'published',
  add column if not exists short_answer text not null default '',
  add column if not exists extended_content text not null default '',
  add column if not exists alternate_questions text[] not null default '{}',
  add column if not exists key_takeaways jsonb not null default '[]'::jsonb,
  add column if not exists sources jsonb not null default '[]'::jsonb,
  add column if not exists same_as text[] not null default '{}',
  add column if not exists related_faqs text[] not null default '{}',
  add column if not exists reviewed_by text not null default '',
  add column if not exists last_reviewed date,
  add column if not exists meta_title text not null default '',
  add column if not exists meta_description text not null default '',
  add column if not exists focus_keyword text not null default '',
  add column if not exists secondary_keywords text[] not null default '{}',
  add column if not exists canonical_url text not null default '',
  add column if not exists og_image text not null default '',
  add column if not exists noindex boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

-- Existing FAQs keep their visibility: the old is_published flag becomes the new status.
update public.faqs
set status = case when coalesce(is_published, true) then 'published' else 'draft' end;

-- Give every existing FAQ a clean, unique web address (the question, lowercase, hyphenated, max 60 characters)
with raw as (
  select id, created_at,
         trim(both '-' from regexp_replace(lower(question), '[^a-z0-9]+', '-', 'g')) as s
  from public.faqs
  where slug is null or slug = ''
), base as (
  select id, created_at,
         coalesce(nullif(trim(both '-' from case when length(s) > 60 then regexp_replace(left(s, 60), '-[^-]*$', '') else s end), ''), 'faq') as s
  from raw
), ranked as (
  select id, s, row_number() over (partition by s order by created_at, id) as rn from base
)
update public.faqs t
set slug = case when r.rn = 1 then r.s else r.s || '-' || r.rn end
from ranked r
where t.id = r.id;

-- Safety net: any FAQ inserted without a web address (e.g. by older code) gets a clean unique one automatically
create or replace function public.faq_set_slug() returns trigger language plpgsql as $$
declare base text; raw text; candidate text; n int := 1;
begin
  if new.slug is null or new.slug = '' then
    raw := trim(both '-' from regexp_replace(lower(new.question), '[^a-z0-9]+', '-', 'g'));
    if length(raw) > 60 then raw := regexp_replace(left(raw, 60), '-[^-]*$', ''); end if;
    base := coalesce(nullif(trim(both '-' from raw), ''), 'faq');
    candidate := base;
    while exists (select 1 from public.faqs where slug = candidate) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end $$;
drop trigger if exists faq_set_slug_trg on public.faqs;
create trigger faq_set_slug_trg before insert on public.faqs
  for each row execute function public.faq_set_slug();

-- status is the source of truth; is_published is kept in step so older code that still reads
-- or writes it can never disagree with it (a contradictory insert is treated as a hidden draft).
create or replace function public.faq_sync_status() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status
     and new.is_published is distinct from old.is_published then
    new.status := case when coalesce(new.is_published, true) then 'published' else 'draft' end;
  elsif tg_op = 'INSERT' and coalesce(new.is_published, true) = false then
    new.status := 'draft';
  end if;
  new.is_published := (new.status = 'published');
  return new;
end $$;
drop trigger if exists faq_sync_status_trg on public.faqs;
create trigger faq_sync_status_trg before insert or update on public.faqs
  for each row execute function public.faq_sync_status();

alter table public.faqs alter column slug set not null;
create unique index if not exists faqs_slug_key on public.faqs (slug);
create index if not exists faqs_status_idx on public.faqs (status);

alter table public.faqs drop constraint if exists faqs_status_check;
alter table public.faqs add constraint faqs_status_check check (status in ('draft', 'published'));
alter table public.faqs drop constraint if exists faqs_slug_format;
alter table public.faqs add constraint faqs_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Visitors may only read PUBLISHED FAQs (drafts stay private). Before this, drafts were readable by anyone.
drop policy if exists "Allow public SELECT faqs" on public.faqs;
create policy "Allow public SELECT faqs" on public.faqs
  for select using (status = 'published');
