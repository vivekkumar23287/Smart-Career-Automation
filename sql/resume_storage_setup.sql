
ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_url TEXT;


insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;




create policy "Public Access to Resumes"
  on storage.objects for select
  using ( bucket_id = 'resumes' );


create policy "Authenticated Users can upload resumes"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes' AND
    auth.role() = 'authenticated'
  );


create policy "Users can update own resumes"
  on storage.objects for update
  using ( bucket_id = 'resumes' AND auth.uid() = owner );


create policy "Users can delete own resumes"
  on storage.objects for delete
  using ( bucket_id = 'resumes' AND auth.uid() = owner );
