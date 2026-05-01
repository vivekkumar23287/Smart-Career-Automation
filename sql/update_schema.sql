
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS resume_url TEXT;

console.log('✅ Column resume_url added to applications table');

