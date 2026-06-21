-- Add report fields to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS report_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS report_content TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS chakra_scores JSONB;

-- Insert Free Energy Session service if not exists
INSERT INTO services (id, name, price, duration, rating, practitioner, category, image, description)
VALUES (
    'srv-free',
    'Free Energy Session',
    0,
    '15 Minutes',
    5.0,
    'Dr. Elara Vance',
    'Energy',
    'aura_balancing',
    'A complimentary 15-minute diagnostic session to scan your aura fields and map somatic blockages.'
)
ON CONFLICT (id) DO NOTHING;

-- Link it to Energy category (cat-1)
INSERT INTO service_categories (service_id, category_id)
VALUES ('srv-free', 'cat-1')
ON CONFLICT DO NOTHING;
