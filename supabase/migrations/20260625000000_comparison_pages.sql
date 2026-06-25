-- Comparison pages for healing modality side-by-side views
CREATE TABLE IF NOT EXISTS comparison_pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  modality_a_name TEXT NOT NULL DEFAULT '',
  modality_a_price TEXT DEFAULT '',
  modality_a_service_id TEXT,
  modality_b_name TEXT NOT NULL DEFAULT '',
  modality_b_price TEXT DEFAULT '',
  modality_b_service_id TEXT,
  rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  media JSONB NOT NULL DEFAULT '[]'::jsonb,
  service_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default healing modal comparison (matches legacy static page)
INSERT INTO comparison_pages (
  id, slug, title, subtitle,
  modality_a_name, modality_a_price,
  modality_b_name, modality_b_price,
  rows, media, service_ids
) VALUES (
  'cmp-healing-modal',
  'healing-modal',
  'Healing Modal Comparison',
  'Compare our signature spiritual practices side-by-side to determine which session aligns with your needs.',
  'Aura Scanning', '₹1,500 / SESSION',
  'Chakra Healing', '₹2,500 / SESSION',
  '[
    {"label":"Primary Purpose","valueA":"Identify leaks, blockages, and color fields in the electromagnetic body.","valueB":"Realign and open active energy vortexes along the spinal path."},
    {"label":"Best For Seekers of","valueA":"Self-awareness, mapping body blockages, and baseline diagnostic reports.","valueB":"Anxiety relief, dissolving muscle tension, and emotional catharsis."},
    {"label":"Session Modality","valueA":"Passive, diagnostic scanning and visual mapping.","valueB":"Active therapeutic intervention (sound waves, crystal placement)."},
    {"label":"Relieves Anxiety","valueA":"Moderate (provides mental relief via clarity & diagnostics).","valueB":"High (direct somatic nervous system calming)."},
    {"label":"Tools Utilized","valueA":"Bio-resonance sensors, optical frequency maps.","valueB":"Tibetan sound bowls, quartz crystals, tuning forks."},
    {"label":"Recommended Frequency","valueA":"Once every 3 months (quarterly energy check).","valueB":"Bi-weekly during high-stress periods."},
    {"label":"Session Duration","valueA":"45 Minutes","valueB":"60 Minutes"}
  ]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
) ON CONFLICT (slug) DO NOTHING;
