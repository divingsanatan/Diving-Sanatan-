-- Add is_show_featured_page column to blogs table
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS is_show_featured_page BOOLEAN DEFAULT TRUE;
