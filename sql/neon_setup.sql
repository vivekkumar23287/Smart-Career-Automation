CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT,
  application_date DATE NOT NULL,
  source TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL CHECK (status IN ('Applied', 'Interview Scheduled', 'Offer', 'Rejected', 'On Hold')),
  hr_name TEXT,
  hr_email TEXT,
  salary TEXT,
  job_url TEXT,
  resume_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);

CREATE TABLE IF NOT EXISTS resume_analyses (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  resume_name TEXT NOT NULL,
  total_score INTEGER NOT NULL,
  section_scores JSONB NOT NULL,
  analysis_results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_id ON resume_analyses(user_id);

CREATE TABLE IF NOT EXISTS ai_tool_payments (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  utr_number TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  screenshot_b64 TEXT,
  screenshot_type TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_tool_payments_user_id ON ai_tool_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_payments_user_email ON ai_tool_payments(user_email);
