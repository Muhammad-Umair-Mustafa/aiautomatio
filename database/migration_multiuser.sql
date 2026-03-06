-- ============================================================
-- MIGRATION: Multi-user support + API keys
-- Run this in Supabase SQL Editor AFTER the original schema.sql
-- ============================================================

-- 1. Drop old public RLS policies (from the single-user setup)
DROP POLICY IF EXISTS "Allow public insert on leads"          ON leads;
DROP POLICY IF EXISTS "Allow public select on leads"          ON leads;
DROP POLICY IF EXISTS "Allow public select on email_stats"    ON email_stats;
DROP POLICY IF EXISTS "Allow public update on email_stats"    ON email_stats;

-- 2. Add user_id column to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Add user_id column to email_stats (unique: 1 stats row per user)
ALTER TABLE email_stats ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE email_stats DROP CONSTRAINT IF EXISTS email_stats_user_id_key;
ALTER TABLE email_stats ADD CONSTRAINT email_stats_user_id_key UNIQUE (user_id);

-- 4. Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key        TEXT UNIQUE NOT NULL,
  name       TEXT DEFAULT 'Default Key',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE leads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys   ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies — users see only their own data
CREATE POLICY "Users see own leads"
  ON leads FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users see own stats"
  ON email_stats FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users see own api_keys"
  ON api_keys FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 7. Allow anon to read api_keys by key (for webhook validation)
--    The API route looks up user_id by key — needs to work without a session
CREATE POLICY "Anon can lookup api_keys by key"
  ON api_keys FOR SELECT
  TO anon
  USING (true);

-- 8. Allow service role / anon to insert leads (from webhook using api_key lookup)
--    The API route inserts with explicit user_id, so we allow it:
CREATE POLICY "Service can insert leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- 9. Allow anon to update email_stats (stats update after webhook insert)
CREATE POLICY "Service can update stats"
  ON email_stats FOR UPDATE
  TO anon
  USING (true);

-- 10. Allow anon to select email_stats (for stats update count queries)
CREATE POLICY "Service can select stats"
  ON email_stats FOR SELECT
  TO anon
  USING (true);

-- 11. Allow anon to select leads (for count queries in stats update)
CREATE POLICY "Service can select leads for count"
  ON leads FOR SELECT
  TO anon
  USING (true);

-- 12. Trigger: auto-create a stats row + api key when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO email_stats (user_id, total_sent, sent_today, sent_this_week)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO api_keys (user_id, key, name)
  VALUES (
    NEW.id,
    'sk-' || encode(gen_random_bytes(24), 'hex'),
    'Default Key'
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
