-- Topic hubs ("pillar" pages): one topic links a guide, articles, questions, videos and glossary terms.
-- Server-only tables (RLS on, no policies), like the rest of the site. Safe to re-run.

create table if not exists public.topics (
  id text primary key,
  slug text not null unique,
  title text not null,
  short_answer text not null default '',
  overview_html text not null default '',
  key_takeaways jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  same_as text[] not null default '{}',
  alternate_questions text[] not null default '{}',
  focus_keyword text not null default '',
  secondary_keywords text[] not null default '{}',
  meta_title text not null default '',
  meta_description text not null default '',
  canonical_url text not null default '',
  og_image text not null default '',
  author_name text not null default 'Diving Sanatan Team',
  author_credentials text not null default '',
  reviewed_by text not null default '',
  last_reviewed date,
  cta_label text not null default 'Book a session',
  cta_url text not null default '/explore-services',
  cta_text text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  noindex boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.topic_items (
  id uuid primary key default gen_random_uuid(),
  topic_id text not null references public.topics(id) on delete cascade,
  item_type text not null check (item_type in ('blog', 'qa', 'video', 'glossary')),
  item_slug text not null,
  role text not null default 'cluster' check (role in ('pillar', 'cluster', 'supporting')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (topic_id, item_type, item_slug)
);
create index if not exists topic_items_topic_idx on public.topic_items (topic_id, sort_order);
create index if not exists topic_items_item_idx on public.topic_items (item_type, item_slug);

alter table public.topics enable row level security;
alter table public.topic_items enable row level security;

-- Small fixes found while mapping content
update public.blogs set title = replace(title, '&amp;', '&') where title like '%&amp;%';
update public.blogs set title = 'Tantra: Philosophy, Practices and Spiritual Traditions Explained',
  meta_title = 'Tantra: Philosophy, Practices and Spiritual Traditions Explained'
  where slug = 'understanding-its-philosophy-practices-and-spiritual-traditions';
update public.blogs set title = 'The Real Purpose of Tantra: A Journey Beyond the Physical',
  meta_title = 'The Real Purpose of Tantra: A Journey Beyond the Physical'
  where slug = 'a-journey-beyond-the-physical';

-- Three starter hubs, saved as drafts. Publish each from Admin > Topics after reading it.
insert into public.topics (id, slug, title, short_answer, overview_html, key_takeaways, sources, same_as, alternate_questions,
  focus_keyword, secondary_keywords, meta_title, meta_description, cta_label, cta_url, cta_text, sort_order, status)
values
('topic-psychology-of-sanatan-dharma', 'psychology-of-sanatan-dharma', 'Psychology of Sanatan Dharma',
$a$The psychology of Sanatan Dharma is how texts such as the Bhagavad Gita and the Upanishads describe the mind: how attachment turns into fear and anger, why the mind can be a friend or an enemy, and which practices bring steadiness. It complements modern psychology and does not replace it.$a$,
$a$<h2>How does Sanatan Dharma understand the mind?</h2><p>Indian philosophical texts have studied the mind in great detail for thousands of years. The Bhagavad Gita in particular reads like a practical manual for the inner life: it asks why we get stuck in fear, anger and indecision, and what helps us act with clarity instead.</p><h3>The mind as friend or enemy</h3><p>In chapter 6, the Gita says a person should lift themselves by their own effort, because the mind can be both our best friend and our worst enemy. A trained mind supports us. An untrained mind works against us. This is the starting point for every practice in this guide.</p><h3>How attachment turns into anger</h3><p>Chapter 2 (verses 62 and 63) describes a chain: dwelling on what we want leads to attachment, attachment to desire, and blocked desire to anger. Anger then clouds judgement and memory. Seeing this chain early is a practical skill. You can learn to notice the first link, the repeated thought, before it becomes a reaction. Our glossary entries on <a href="https://divingsanatan.online/blog/glossary/detachment">detachment</a> and <a href="https://divingsanatan.online/blog/glossary/ego">ego</a> explain the terms.</p><h3>Acting without clinging to results</h3><p>Chapter 2, verse 47 teaches that we have a right to our actions but not to their fruits. This is often called <em>anasakti</em>, or non-attachment to outcomes. It does not mean not caring. It means doing your best while loosening your grip on results you cannot fully control. Our article on <a href="https://divingsanatan.online/blog/loss-aversion-gita-psychology">loss aversion and the Gita</a> shows how this idea applies to fear of loss.</p><h3>Steadiness of mind</h3><p>The Gita describes a steady person (<em>sthitaprajna</em>) as someone who stays balanced in success and failure. This steadiness, called <em>samatvam</em>, is built through daily practice: <a href="https://divingsanatan.online/blog/glossary/mindfulness">mindfulness</a>, breath awareness, <a href="https://divingsanatan.online/blog/glossary/jaap">mantra repetition</a> and meditation.</p><h3>How does this connect with modern psychology?</h3><p>Some ideas line up closely with modern findings. For example, researchers describe loss aversion, the tendency to feel a loss more strongly than an equal gain. Other ideas, such as rebirth or karma, belong to a spiritual framework rather than to psychology. It helps to treat these texts as a wise lens for reflection, not as a clinical method.</p><p>If anxiety, anger or low mood is affecting your daily life, please speak with a doctor or a qualified mental health professional. The practices here can sit beside that care but should not replace it.</p>$a$,
$a$["The Gita treats the mind as both friend and enemy, depending on how well it is trained.","Attachment and blocked desire can build into anger, which clouds judgement. Noticing the early link helps.","Anasakti means acting with full effort while loosening attachment to results. It is not indifference.","Steadiness of mind (samatvam) is built through daily practice such as mindfulness, breath awareness and mantra.","These teachings give a reflective lens that can complement modern psychology, but they are not a substitute for professional mental health care."]$a$::jsonb,
$a$[{"url":"https://www.britannica.com/topic/Bhagavad-Gita","title":"Bhagavad Gita (Encyclopaedia Britannica)"},{"url":"https://www.britannica.com/topic/Hinduism","title":"Hinduism (Encyclopaedia Britannica)"}]$a$::jsonb,
ARRAY['https://en.wikipedia.org/wiki/Bhagavad_Gita','https://en.wikipedia.org/wiki/Loss_aversion'],
ARRAY['What does the Bhagavad Gita say about anger?','Is the mind a friend or an enemy in the Gita?','What is anasakti or detachment from results?','How does Sanatan Dharma explain attachment and fear?','Can Vedic wisdom help with overthinking?'],
'psychology of sanatan dharma', ARRAY['Gita psychology','Bhagavad Gita on anger','detachment from outcomes','Vedic psychology','Indian psychology','mind control in the Gita'],
$a$Psychology of Sanatan Dharma: The Gita and the Mind$a$,
$a$How the Bhagavad Gita explains attachment, fear, anger and steadiness of mind, with articles, videos, questions and a glossary to go deeper.$a$,
'Talk to a guide', '/explore-services', $a$Want personal guidance on stress, anger or overthinking? Our certified guides can help you explore these ideas in practice.$a$, 1, 'draft'),

('topic-tantra', 'tantra', 'Tantra',
$a$Tantra is a family of Hindu, Buddhist and Jain traditions that use mantra, ritual, meditation and visualisation to work with energy and awareness. Its texts, called Tantras, took shape from about the mid-first millennium CE. It is far broader than the purely sexual meaning often given to it in popular culture.$a$,
$a$<h2>What is Tantra?</h2><p>The word <em>tantra</em> means "loom" or "weave" in Sanskrit, and it names both a body of texts and a way of practice. Scholars trace the earliest distinct Tantric traditions to a Hindu setting around the middle of the first millennium CE, with Buddhist forms appearing in the 7th century. Today it is studied as a living tradition across India, Nepal, Tibet and beyond.</p><h3>Core ideas</h3><ul><li><strong>Shakti:</strong> divine creative energy, often described as the feminine power of the divine.</li><li><strong>Sadhana:</strong> a structured spiritual practice carried out regularly, usually under a teacher.</li><li><strong>Mantra and yantra:</strong> sacred sound and sacred diagram, used as supports for concentration. See <a href="https://divingsanatan.online/blog/glossary/jaap">jaap</a>, <a href="https://divingsanatan.online/blog/glossary/om">Om</a> and <a href="https://divingsanatan.online/blog/glossary/sacred-geometry">sacred geometry</a>.</li><li><strong>The body as a path:</strong> instead of rejecting the body, Tantric practice works with breath, posture and subtle energy. <a href="https://divingsanatan.online/blog/glossary/kundalini-awakening">Kundalini</a> is the best-known example.</li></ul><h3>Common misconceptions</h3><p>In popular culture Tantra is often reduced to sexuality. Traditional Tantra is much wider and centres on ritual, devotion, meditation and philosophy. A small number of texts describe unconventional rites that are not part of ordinary Hindu worship, and they are not the focus of the tradition as a whole. Our article on the <a href="https://divingsanatan.online/blog/a-journey-beyond-the-physical">real purpose of Tantra</a> explores this further.</p><h3>How to approach it with care</h3><ul><li>Start with the philosophy and simple practices such as mantra and breath awareness.</li><li>Learn advanced practices only from a qualified, ethical teacher. See what a <a href="https://divingsanatan.online/blog/glossary/guru">guru</a> is in the tradition.</li><li>Be cautious of anyone who promises miracle results or asks for money to unlock secret powers.</li></ul><p>Tantra is a spiritual path and not a medical treatment. If you have health concerns, please consult a qualified professional.</p>$a$,
$a$["Tantra means 'loom' in Sanskrit and refers to both a set of texts and a way of practice.","Hindu Tantric traditions emerged around the mid-first millennium CE, with Buddhist forms from about the 7th century.","Core ideas include shakti, sadhana, mantra, yantra and working with the body and subtle energy.","Tantra is much broader than the sexual meaning common in popular culture.","Advanced practices are traditionally learned from a qualified teacher, and it is not a medical treatment."]$a$::jsonb,
$a$[{"url":"https://www.britannica.com/topic/Tantra-religious-texts","title":"Tantra (Encyclopaedia Britannica)"},{"url":"https://www.britannica.com/topic/Tantric-Hinduism","title":"Tantric Hinduism (Encyclopaedia Britannica)"}]$a$::jsonb,
ARRAY['https://en.wikipedia.org/wiki/Tantra','https://en.wikipedia.org/wiki/Shakti'],
ARRAY['What is Tantra in simple words?','Is Tantra only about sex?','What is sadhana in Tantra?','What is the difference between Tantra and Yoga?','Do I need a guru to practise Tantra?'],
'what is tantra', ARRAY['Tantra meaning','Tantra philosophy','Tantric practices','Tantra misconceptions','kundalini and Tantra','Hindu Tantra'],
$a$What Is Tantra? Meaning, Philosophy and Practices$a$,
$a$A clear, careful guide to Tantra: its meaning, core ideas, common myths and how to approach practice safely, with articles and glossary terms.$a$,
'Talk to a guide', '/explore-services', $a$Curious about mantra, meditation or energy practices? Our guides can help you start safely.$a$, 2, 'draft'),

('topic-chakras', 'chakras', 'Chakras',
$a$Chakras (Sanskrit for wheel) are described in Indian yogic and Tantric traditions as energy centres along the spine, usually numbered seven in modern teaching. They are a contemplative map for meditation and self-awareness, not a medically proven system, and chakra practices should complement, not replace, health care.$a$,
$a$<h2>What are chakras?</h2><p>The word <em>chakra</em> means wheel or circle in Sanskrit. In yoga and Tantra, chakras are described as centres of subtle energy that run from the base of the spine to the crown of the head. They are not physical organs. Practitioners use them as a map for meditation, breath and self-reflection.</p><h3>The seven chakras</h3><ul><li><a href="https://divingsanatan.online/blog/glossary/muladhara-chakra"><strong>Muladhara</strong></a> (root, base of the spine): stability and grounding.</li><li><a href="https://divingsanatan.online/blog/glossary/svadhisthana-chakra"><strong>Svadhisthana</strong></a> (lower abdomen): creativity, emotion and pleasure.</li><li><a href="https://divingsanatan.online/blog/glossary/manipura-chakra"><strong>Manipura</strong></a> (navel): willpower and confidence.</li><li><a href="https://divingsanatan.online/blog/glossary/anahata-chakra"><strong>Anahata</strong></a> (heart): compassion and love.</li><li><a href="https://divingsanatan.online/blog/glossary/vishuddha-chakra"><strong>Vishuddha</strong></a> (throat): honest expression.</li><li><a href="https://divingsanatan.online/blog/glossary/ajna-chakra"><strong>Ajna</strong></a> (between the brows): insight and intuition.</li><li><a href="https://divingsanatan.online/blog/glossary/sahastrara-chakra"><strong>Sahasrara</strong></a> (crown): spiritual connection.</li></ul><h3>Where does the idea come from?</h3><p>The idea of chakras developed in Indian yogic and Tantric texts over many centuries. Early Buddhist and Hindu sources describe different numbers of chakras, with four, five, six or seven appearing in different texts. The popular seven-chakra system with colours is largely a modern Western presentation that grew in the 20th century.</p><h3>How are chakras used in practice?</h3><ul><li><strong>Meditation:</strong> placing attention on each centre in turn.</li><li><strong>Breathwork and <a href="https://divingsanatan.online/blog/glossary/prana">prana</a>:</strong> using the breath to settle the mind.</li><li><strong>Mantra:</strong> repeating seed sounds associated with each centre.</li><li><strong>Grounding:</strong> simple practices that bring awareness back to the body. See <a href="https://divingsanatan.online/blog/glossary/grounding">grounding</a>.</li></ul><h3>What does science say?</h3><p>There is no scientific evidence that chakras exist as physical structures or that balancing them treats illness. Many people nevertheless find the framework useful for reflection and relaxation. Treat it as a contemplative tool.</p><p>Some intense practices, such as <a href="https://divingsanatan.online/blog/glossary/kundalini-awakening">kundalini awakening</a>, are best learned with an experienced teacher. If you have physical or mental health concerns, please see a qualified professional.</p>$a$,
$a$["Chakra means wheel in Sanskrit and refers to centres of subtle energy described in yogic and Tantric traditions.","The seven-chakra system runs from the root (Muladhara) to the crown (Sahasrara), each linked to a theme such as grounding, creativity or intuition.","Historical texts describe different numbers of chakras, and the colourful seven-chakra model is largely a modern Western presentation.","Chakras are used as a map for meditation, breath, mantra and grounding.","There is no scientific evidence that chakras are physical structures or that balancing them treats illness, so they should complement, not replace, health care."]$a$::jsonb,
$a$[{"url":"https://www.britannica.com/topic/chakra","title":"Chakra (Encyclopaedia Britannica)"},{"url":"https://en.wikipedia.org/wiki/Chakra","title":"Chakra (Wikipedia)"}]$a$::jsonb,
ARRAY['https://en.wikipedia.org/wiki/Chakra','https://en.wikipedia.org/wiki/Kundalini'],
ARRAY['What are the 7 chakras and what do they mean?','What is the origin of chakras?','Are chakras real?','How do I balance my chakras?','What is the root chakra?'],
'what are chakras', ARRAY['seven chakras','chakra meanings','chakra healing','root chakra','heart chakra','chakra meditation','chakra balancing'],
$a$What Are Chakras? The 7 Chakras Explained$a$,
$a$A balanced guide to the seven chakras: their meanings, where the idea comes from, how they are used in practice and what science says.$a$,
'Book a chakra session', '/explore-services', $a$Want to explore chakra meditation with an experienced guide? Browse our healing sessions.$a$, 3, 'draft')
on conflict (slug) do nothing;

insert into public.topic_items (topic_id, item_type, item_slug, role, sort_order)
select t.id, v.item_type, v.item_slug, v.role, v.sort_order
from (values
  ('psychology-of-sanatan-dharma','blog','loss-aversion-gita-psychology','cluster',10),
  ('psychology-of-sanatan-dharma','blog','why-your-anger-kills-your-brain-cells-amp-intelligence','cluster',20),
  ('psychology-of-sanatan-dharma','qa','what-is-san-tana-dharma-and-how-does-it-differ-from-hinduism','supporting',30),
  ('psychology-of-sanatan-dharma','qa','how-can-buddhist-mindfulness-help-with-anxiety','supporting',40),
  ('psychology-of-sanatan-dharma','glossary','detachment','supporting',10),
  ('psychology-of-sanatan-dharma','glossary','ego','supporting',20),
  ('psychology-of-sanatan-dharma','glossary','willpower','supporting',30),
  ('psychology-of-sanatan-dharma','glossary','samskara','supporting',40),
  ('psychology-of-sanatan-dharma','glossary','mindfulness','supporting',50),
  ('psychology-of-sanatan-dharma','glossary','inner-peace','supporting',60),
  ('tantra','blog','understanding-its-philosophy-practices-and-spiritual-traditions','pillar',0),
  ('tantra','blog','a-journey-beyond-the-physical','cluster',10),
  ('tantra','glossary','tantra','supporting',10),
  ('tantra','glossary','kundalini-awakening','supporting',20),
  ('tantra','glossary','om','supporting',30),
  ('tantra','glossary','jaap','supporting',40),
  ('tantra','glossary','nada-yoga','supporting',50),
  ('tantra','glossary','kriya-yoga','supporting',60),
  ('tantra','glossary','sacred-geometry','supporting',70),
  ('tantra','glossary','guru','supporting',80),
  ('chakras','glossary','chakra','supporting',10),
  ('chakras','glossary','muladhara-chakra','supporting',20),
  ('chakras','glossary','svadhisthana-chakra','supporting',30),
  ('chakras','glossary','manipura-chakra','supporting',40),
  ('chakras','glossary','anahata-chakra','supporting',50),
  ('chakras','glossary','vishuddha-chakra','supporting',60),
  ('chakras','glossary','ajna-chakra','supporting',70),
  ('chakras','glossary','sahastrara-chakra','supporting',80),
  ('chakras','glossary','kundalini-awakening','supporting',90),
  ('chakras','glossary','prana','supporting',100),
  ('chakras','glossary','grounding','supporting',110),
  ('chakras','glossary','third-eye-awakening','supporting',120)
) as v(topic_slug, item_type, item_slug, role, sort_order)
join public.topics t on t.slug = v.topic_slug
on conflict (topic_id, item_type, item_slug) do nothing;
