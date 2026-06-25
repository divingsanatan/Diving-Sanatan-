-- Normalize emails to lowercase and enforce uniqueness for auth + leads deduplication
UPDATE user_profiles SET email = LOWER(TRIM(email)) WHERE email IS NOT NULL;

-- Remove duplicate emails, keeping the most recently created profile
DELETE FROM user_profiles a
USING user_profiles b
WHERE LOWER(TRIM(a.email)) = LOWER(TRIM(b.email))
  AND a.created_at < b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email_unique ON user_profiles (LOWER(email));
