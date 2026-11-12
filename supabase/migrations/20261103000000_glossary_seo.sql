-- Glossary SEO / GEO / AEO fields. Purely additive: every existing term keeps working.
alter table public.glossary_terms
  add column if not exists slug text,
  add column if not exists status text not null default 'published',
  add column if not exists short_answer text not null default '',
  add column if not exists extended_content text not null default '',
  add column if not exists origin text not null default '',
  add column if not exists alternate_names text[] not null default '{}',
  add column if not exists key_takeaways jsonb not null default '[]'::jsonb,
  add column if not exists faqs jsonb not null default '[]'::jsonb,
  add column if not exists sources jsonb not null default '[]'::jsonb,
  add column if not exists same_as text[] not null default '{}',
  add column if not exists related_terms text[] not null default '{}',
  add column if not exists image_alt text not null default '',
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

-- Give every existing term a clean, unique web address (word without brackets, lowercase, hyphenated)
with base as (
  select id,
         coalesce(nullif(trim(both '-' from regexp_replace(lower(regexp_replace(word, '\([^)]*\)', ' ', 'g')), '[^a-z0-9]+', '-', 'g')), ''), 'term') as s,
         created_at
  from public.glossary_terms
  where slug is null or slug = ''
), ranked as (
  select id, s, row_number() over (partition by s order by created_at, id) as rn from base
)
update public.glossary_terms t
set slug = case when r.rn = 1 then r.s else r.s || '-' || r.rn end
from ranked r
where t.id = r.id;

-- Safety net: any term inserted without a web address (e.g. by older code) gets a clean unique one automatically
create or replace function public.glossary_set_slug() returns trigger language plpgsql as $$
declare base text; candidate text; n int := 1;
begin
  if new.slug is null or new.slug = '' then
    base := coalesce(nullif(trim(both '-' from regexp_replace(lower(regexp_replace(new.word, '\([^)]*\)', ' ', 'g')), '[^a-z0-9]+', '-', 'g')), ''), 'term');
    candidate := base;
    while exists (select 1 from public.glossary_terms where slug = candidate) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end $$;
drop trigger if exists glossary_set_slug_trg on public.glossary_terms;
create trigger glossary_set_slug_trg before insert on public.glossary_terms
  for each row execute function public.glossary_set_slug();

alter table public.glossary_terms alter column slug set not null;
create unique index if not exists glossary_terms_slug_key on public.glossary_terms (slug);

alter table public.glossary_terms drop constraint if exists glossary_terms_status_check;
alter table public.glossary_terms add constraint glossary_terms_status_check check (status in ('draft', 'published'));
alter table public.glossary_terms drop constraint if exists glossary_terms_slug_format;
alter table public.glossary_terms add constraint glossary_terms_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Visitors may only read PUBLISHED terms (drafts stay private)
drop policy if exists "Allow public SELECT glossary_terms" on public.glossary_terms;
create policy "Allow public SELECT glossary_terms" on public.glossary_terms
  for select using (status = 'published');
