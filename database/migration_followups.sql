-- ============================================================
-- MIGRATION: Follow-up Automation Manager
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. SMTP Settings (one row per user)
CREATE TABLE IF NOT EXISTS smtp_settings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  smtp_host     TEXT NOT NULL DEFAULT '',
  smtp_port     INTEGER NOT NULL DEFAULT 587,
  smtp_username TEXT NOT NULL DEFAULT '',
  smtp_password TEXT NOT NULL DEFAULT '',
  sender_email  TEXT NOT NULL DEFAULT '',
  sender_name   TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Follow-up Sequences
CREATE TABLE IF NOT EXISTS followup_sequences (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  send_interval_minutes INTEGER NOT NULL DEFAULT 5,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Follow-up Steps
CREATE TABLE IF NOT EXISTS followup_steps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID REFERENCES followup_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  delay_hours INTEGER NOT NULL DEFAULT 24,
  subject     TEXT NOT NULL DEFAULT '',
  ai_prompt   TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_id, step_number)
);

-- 4. Follow-up Logs (queue + audit)
CREATE TABLE IF NOT EXISTS followup_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id       UUID REFERENCES leads(id) ON DELETE CASCADE,
  sequence_id   UUID REFERENCES followup_sequences(id) ON DELETE SET NULL,
  step_number   INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  email_content TEXT,
  scheduled_at  TIMESTAMPTZ,
  sent_at       TIMESTAMPTZ,
  error         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_followup_logs_status       ON followup_logs(status);
CREATE INDEX IF NOT EXISTS idx_followup_logs_scheduled_at ON followup_logs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_followup_logs_lead_id      ON followup_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_followup_steps_sequence    ON followup_steps(sequence_id, step_number);

-- 6. RLS
ALTER TABLE smtp_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_steps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_logs      ENABLE ROW LEVEL SECURITY;

-- smtp_settings: user owns their own row
CREATE POLICY "Users manage own smtp" ON smtp_settings FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- followup_sequences: user owns their sequences
CREATE POLICY "Users manage own sequences" ON followup_sequences FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- followup_steps: accessible if owning the parent sequence
CREATE POLICY "Users manage own steps" ON followup_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM followup_sequences s
      WHERE s.id = followup_steps.sequence_id AND s.user_id = auth.uid()
    )
  );

-- followup_logs: anon (webhook) can insert/update; user can read their own
CREATE POLICY "Anon can manage followup_logs" ON followup_logs FOR ALL
  TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Users read own followup_logs" ON followup_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads l WHERE l.id = followup_logs.lead_id AND l.user_id = auth.uid()
    )
  );

-- Allow anon to read sequences and steps (needed for queue processor with api key)
CREATE POLICY "Anon read sequences" ON followup_sequences FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read steps"     ON followup_steps     FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read smtp"      ON smtp_settings      FOR SELECT TO anon USING (true);
