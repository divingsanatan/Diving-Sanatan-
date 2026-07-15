-- Add custom_css and publish_date columns to keywords table
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS custom_css TEXT;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS publish_date TIMESTAMP WITH TIME ZONE;
