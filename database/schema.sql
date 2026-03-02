-- AI Outreach Dashboard Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: leads
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name    TEXT NOT NULL,
  company_name TEXT,
  email        TEXT NOT NULL,
  phone        TEXT,
  website      TEXT,
  email_content TEXT,
  campaign_name TEXT,
  status       TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'pending', 'failed', 'replied')),
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common search patterns
CREATE INDEX IF NOT EXISTS idx_leads_email        ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_campaign     ON leads(campaign_name);
CREATE INDEX IF NOT EXISTS idx_leads_sent_at      ON leads(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status       ON leads(status);

-- ============================================================
-- Table: email_stats
-- ============================================================
CREATE TABLE IF NOT EXISTS email_stats (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_sent     INTEGER DEFAULT 0,
  sent_today     INTEGER DEFAULT 0,
  sent_this_week INTEGER DEFAULT 0,
  last_sent_at   TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Seed a single stats row (used as a global counter)
INSERT INTO email_stats (id, total_sent, sent_today, sent_this_week)
VALUES (uuid_generate_v4(), 0, 0, 0)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Function: update_email_stats()
-- Called by API after inserting a lead
-- ============================================================
CREATE OR REPLACE FUNCTION update_email_stats()
RETURNS void AS $$
BEGIN
  UPDATE email_stats SET
    total_sent     = (SELECT COUNT(*) FROM leads WHERE status = 'sent'),
    sent_today     = (SELECT COUNT(*) FROM leads WHERE status = 'sent' AND sent_at >= CURRENT_DATE),
    sent_this_week = (SELECT COUNT(*) FROM leads WHERE status = 'sent' AND sent_at >= date_trunc('week', NOW())),
    last_sent_at   = (SELECT MAX(sent_at) FROM leads WHERE status = 'sent'),
    updated_at     = NOW();
END;
$$ LANGUAGE plpgsql;
