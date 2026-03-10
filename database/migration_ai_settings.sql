-- Add AI settings to smtp_settings table
ALTER TABLE smtp_settings ADD COLUMN IF NOT EXISTS openai_api_key TEXT DEFAULT '';
ALTER TABLE smtp_settings ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gpt-4o-mini';
