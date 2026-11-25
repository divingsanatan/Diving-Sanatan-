-- One category list for articles, video blogs, questions and glossary terms (the blog_categories table).
-- Safe to re-run.

insert into public.blog_categories (id, name, approval_status)
select 'bcat-' || substr(md5(lower(v.n)), 1, 7), v.n, 'published'
from (values ('Mind and Emotions'), ('Tantra'), ('Chakras'), ('Chakra Shorts'), ('Meditation and Mindfulness'), ('Aura and Energy'), ('Healing'), ('Sanatan Dharma')) as v(n)
where not exists (select 1 from public.blog_categories b where lower(b.name) = lower(v.n));

create unique index if not exists blog_categories_name_ci on public.blog_categories (lower(name));

-- one spelling per category
update public.qa_questions set category = 'Mind and Emotions' where category = 'Mind & Emotions';
update public.qa_questions set category = 'Meditation and Mindfulness' where category = 'Meditation & Mindfulness';
update public.qa_questions set category = 'Aura and Energy' where category = 'Aura & Energy';
update public.glossary_terms set category = 'Sanatan Dharma' where category = 'Sanatan';
