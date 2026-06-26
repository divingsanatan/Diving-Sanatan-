-- Glossary terms for Metaphysical Glossary page
CREATE TABLE IF NOT EXISTS glossary_terms (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL,
    phonetic TEXT DEFAULT '',
    category TEXT DEFAULT '',
    definition TEXT NOT NULL,
    illustration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS glossary_terms_word_idx ON glossary_terms (word);

ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public SELECT glossary_terms" ON glossary_terms;
CREATE POLICY "Allow public SELECT glossary_terms" ON glossary_terms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin write glossary_terms" ON glossary_terms;
CREATE POLICY "Allow admin write glossary_terms" ON glossary_terms FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default terms (idempotent)
INSERT INTO glossary_terms (id, word, phonetic, category, definition, illustration) VALUES
  ('gloss-aura', 'Aura', '/ˈɔːrə/', 'Bio-Energy', 'The subtle electromagnetic field surrounding a living being. Composed of multiple layers corresponding to mental, emotional, and spiritual states, the aura reflects the vitality and balance of the body''s major energy nodes.', 'aura-chart'),
  ('gloss-chakra', 'Chakra', '/ˈtʃʌkrə/', 'Energy Center', 'Sanskrit for ''wheel'' or ''disk''. Represents the seven focal nodes in the subtle body, aligned along the spine, through which life force energy (prana) flows. Balancing these centers prevents somatic blockages.', 'chakra-system'),
  ('gloss-cleansing', 'Cleansing', '/ˈklɛnzɪŋ/', 'Ritual Practice', 'The process of removing accumulated negative or heavy frequencies from crystals, healing tools, or personal fields. Typically performed using running water, moonlight, sage, or sound bowl frequencies.', NULL),
  ('gloss-energy-node', 'Energy Node', '/ˈɛnərdʒi noʊd/', 'Metaphysics', 'A crossing point of meridians or nadis in the subtle body. High-density intersections create chakras, while minor nodes direct subtle energy flows through limbs and organs.', NULL),
  ('gloss-kundalini', 'Kundalini', '/ˌkʊndəˈliːni/', 'Spirituality', 'A latent spiritual energy coiled at the base of the spine, represented as a sleeping serpent. When awakened through meditation or yoga, it ascends through the chakras to trigger spiritual enlightenment.', NULL),
  ('gloss-mantra', 'Mantra', '/ˈmæntrə/', 'Meditation', 'A sacred sound, syllable, word, or phrase repeated in meditation. The vibrational frequency of a mantra (like ''Om'') helps align brainwaves and soothe the nervous system.', NULL),
  ('gloss-prana', 'Prana', '/ˈprɑːnə/', 'Vital force', 'The Sanskrit term for vital life force or breath. Equivalent to ''Chi'' in Chinese philosophy, prana flows through nadis and sustains all living cells.', NULL),
  ('gloss-reiki', 'Reiki', '/ˈreɪki/', 'Healing', 'A Japanese technique for stress reduction and relaxation that also promotes healing. Administered by ''laying on hands'', it is based on the flow of universal life energy.', NULL)
ON CONFLICT (id) DO NOTHING;
