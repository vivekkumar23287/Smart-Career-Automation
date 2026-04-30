
CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


ALTER TABLE applications ENABLE ROW LEVEL SECURITY;



CREATE POLICY "Users can view own applications" ON applications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON applications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications" ON applications FOR DELETE USING (auth.uid() = user_id);


alter publication supabase_realtime add table applications;
