-- Merge the FAQ section into the Questions hub (qa_questions). Safe to re-run. Nothing is deleted:
-- the old `faqs` table stays untouched as a backup.

-- 1) Comments can now carry a small amount of safe formatting (bold, italic, lists, quotes, links).
alter table public.qa_comments add column if not exists body_format text not null default 'plain';
alter table public.qa_comments drop constraint if exists qa_comments_body_format_check;
alter table public.qa_comments add constraint qa_comments_body_format_check check (body_format in ('plain', 'html'));

-- 2) Copy every published FAQ into the Questions hub as an expert (staff) answered question.
insert into public.qa_questions (
  id, slug, title, description, category, source, asked_by_name, anonymous, status,
  answer, short_answer, answerer_name, answerer_role,
  key_takeaways, sources, same_as, related_questions, alternate_questions,
  reviewed_by, last_reviewed, meta_title, meta_description, focus_keyword, secondary_keywords,
  canonical_url, og_image, noindex, published_at, answered_at, created_at, updated_at
)
select
  'qa-' || substr(md5(f.id), 1, 11),
  f.slug,
  f.question,
  '',
  case
    when f.slug like '%shamanic%' then 'Aura & Energy'
    when f.slug like '%dharma%' then 'Mind & Emotions'
    else 'Meditation & Mindfulness'
  end,
  'staff', '', false, 'published',
  case
    when f.answer ~* '<(p|ul|ol|br|strong|em|a)[ >/]' then f.answer
    else '<p>' || replace(replace(replace(f.answer, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</p>'
  end,
  f.short_answer, 'Diving Sanatan Team', 'Team',
  f.key_takeaways, f.sources, f.same_as, f.related_faqs, f.alternate_questions,
  f.reviewed_by, f.last_reviewed, f.meta_title, f.meta_description, f.focus_keyword, f.secondary_keywords,
  '', f.og_image, f.noindex, f.created_at, f.created_at, f.created_at, now()
from public.faqs f
where f.status = 'published'
on conflict (slug) do nothing;

-- 3) Old FAQ addresses keep working: permanent (301) redirects to the matching question page.
insert into public.redirects (source_path, target_path, status_code)
select '/blog/faq/' || f.slug, '/blog/quora-qa/' || f.slug, 301 from public.faqs f where f.status = 'published'
on conflict (source_path) do nothing;
insert into public.redirects (source_path, target_path, status_code)
values ('/blog/faq', '/blog/quora-qa', 301)
on conflict (source_path) do nothing;
