-- Migration: 20260730000000_seo_automation_schema.sql
-- Description: SEO & AI-Search Visibility Automation Schema + Extensions

-- Enable pgcrypto for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create pending_changes Table
CREATE TABLE IF NOT EXISTS pending_changes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    agent_name TEXT NOT NULL,
    change_type TEXT NOT NULL, -- 'content_edit', 'content_rewrite', 'technical_fix', 'gbp_update', 'canonical_fix'
    target_entity TEXT NOT NULL, -- 'blogs', 'pages', 'services', 'redirects', 'gbp'
    target_id TEXT,
    proposed_data JSONB NOT NULL,
    current_data JSONB,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create agent_runs Table
CREATE TABLE IF NOT EXISTS agent_runs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    agent_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'skipped')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    items_processed INTEGER DEFAULT 0,
    run_summary JSONB DEFAULT '{}'::jsonb
);

-- 3. Create keyword_rankings Table
CREATE TABLE IF NOT EXISTS keyword_rankings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    keyword_id TEXT REFERENCES keywords(id) ON DELETE CASCADE,
    keyword_text TEXT NOT NULL,
    url TEXT NOT NULL,
    position INTEGER,
    search_engine TEXT NOT NULL DEFAULT 'google',
    location TEXT DEFAULT 'US',
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create page_metrics Table
CREATE TABLE IF NOT EXISTS page_metrics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    url TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    ctr NUMERIC(7, 4) DEFAULT 0.0,
    average_position NUMERIC(6, 2) DEFAULT 0.0,
    sessions INTEGER DEFAULT 0,
    bounce_rate NUMERIC(7, 4) DEFAULT 0.0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create ai_visibility_checks Table
CREATE TABLE IF NOT EXISTS ai_visibility_checks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    prompt TEXT NOT NULL,
    keyword TEXT NOT NULL,
    model_engine TEXT NOT NULL,
    cited_urls JSONB DEFAULT '[]'::jsonb,
    contains_brand BOOLEAN DEFAULT false,
    ranking_position INTEGER,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create backlink_opportunities Table
CREATE TABLE IF NOT EXISTS backlink_opportunities (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    source_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    domain_authority INTEGER DEFAULT 0,
    relevance_score NUMERIC(4, 2) DEFAULT 0.0,
    status TEXT DEFAULT 'discovered' CHECK (status IN ('discovered', 'reviewed', 'outreach_drafted', 'contacted', 'rejected', 'acquired')),
    outreach_email_draft JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create gbp_reviews Table
CREATE TABLE IF NOT EXISTS gbp_reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    gbp_review_id TEXT UNIQUE NOT NULL,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reply_draft TEXT,
    reply_status TEXT DEFAULT 'pending' CHECK (reply_status IN ('pending', 'approved', 'posted', 'rejected')),
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create redirects Table
CREATE TABLE IF NOT EXISTS redirects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    source_path TEXT NOT NULL UNIQUE,
    target_path TEXT NOT NULL,
    status_code INTEGER DEFAULT 301 CHECK (status_code IN (301, 302, 307, 308)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Create site_snapshots Table
CREATE TABLE IF NOT EXISTS site_snapshots (
    url TEXT PRIMARY KEY,
    content_hash TEXT NOT NULL,
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Create distribution_log Table
CREATE TABLE IF NOT EXISTS distribution_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    pending_change_id TEXT REFERENCES pending_changes(id) ON DELETE SET NULL,
    target TEXT NOT NULL CHECK (target IN ('gsc_index_request', 'gsc_sitemap_resubmit', 'indexnow', 'bing_sitemap_resubmit', 'gbp_post', 'gbp_profile_update')),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
    pushed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    response_summary JSONB DEFAULT '{}'::jsonb
);

-- 11. Create api_usage_log Table
CREATE TABLE IF NOT EXISTS api_usage_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    service TEXT NOT NULL,
    tokens_or_requests INTEGER NOT NULL DEFAULT 0,
    estimated_cost NUMERIC(10, 6) NOT NULL DEFAULT 0.0,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Add Extended CMS & SEO Fields to blogs table
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'normal' CHECK (content_type IN ('normal', 'comparison', 'faq', 'case_study', 'glossary', 'video', 'qa_style'));
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS content_format TEXT DEFAULT 'plain_text' CHECK (content_format IN ('html', 'plain_text'));
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS focus_keyword TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS robots_directive TEXT DEFAULT 'index, follow';
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS author_bio TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS faq_pairs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS tldr TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS pillar_cluster TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS og_image_override TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS video_embed_url TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS video_transcript TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS pinned_related_articles JSONB DEFAULT '[]'::jsonb;

-- Create Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_pending_changes_status ON pending_changes(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON agent_runs(agent_name);
CREATE INDEX IF NOT EXISTS idx_keyword_rankings_url ON keyword_rankings(url);
CREATE INDEX IF NOT EXISTS idx_page_metrics_url_date ON page_metrics(url, date);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_keyword ON ai_visibility_checks(keyword);
CREATE INDEX IF NOT EXISTS idx_redirects_source ON redirects(source_path);
CREATE INDEX IF NOT EXISTS idx_distribution_log_target ON distribution_log(target);

-- 13. Enable Row Level Security (RLS) on all new tables
ALTER TABLE pending_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_visibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlink_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE gbp_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;

-- Security Policies

-- Public SELECT access on public redirects
DROP POLICY IF EXISTS "Allow public read access to redirects" ON redirects;
CREATE POLICY "Allow public read access to redirects" ON redirects FOR SELECT USING (true);

-- Authenticated / Admin / Service Role full access on all SEO system tables
CREATE POLICY "Allow admin write to pending_changes" ON pending_changes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write to agent_runs" ON agent_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write to keyword_rankings" ON keyword_rankings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write to page_metrics" ON page_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write to ai_visibility_checks" ON ai_visibility_checks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write to backlink_opportunities" ON backlink_opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write to gbp_reviews" ON gbp_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write to redirects" ON redirects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write to site_snapshots" ON site_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write to distribution_log" ON distribution_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write to api_usage_log" ON api_usage_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
