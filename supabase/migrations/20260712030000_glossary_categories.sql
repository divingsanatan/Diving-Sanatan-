-- Glossary categories table
CREATE TABLE IF NOT EXISTS glossary_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE glossary_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public SELECT glossary_categories" ON glossary_categories;
CREATE POLICY "Allow public SELECT glossary_categories" ON glossary_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin write glossary_categories" ON glossary_categories;
CREATE POLICY "Allow admin write glossary_categories" ON glossary_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default categories (idempotent)
INSERT INTO glossary_categories (id, name) VALUES
  ('gcat-bioenergy', 'Bio-Energy'),
  ('gcat-energycenter', 'Energy Center'),
  ('gcat-ritualpractice', 'Ritual Practice'),
  ('gcat-metaphysics', 'Metaphysics'),
  ('gcat-spirituality', 'Spirituality'),
  ('gcat-meditation', 'Meditation'),
  ('gcat-vitalforce', 'Vital force'),
  ('gcat-healing', 'Healing')
ON CONFLICT (name) DO NOTHING;
