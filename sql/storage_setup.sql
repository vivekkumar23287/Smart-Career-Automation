
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true);


create policy "Authenticated users can upload resumes"
on storage.objects for insert
with check (
  bucket_id = 'resumes' AND
  auth.role() = 'authenticated'
);


create policy "Anyone can view resumes"
on storage.objects for select
using ( bucket_id = 'resumes' );



create policy "Users can update own resumes"
on storage.objects for update
using ( bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1] );


create policy "Users can delete own resumes"
on storage.objects for delete
using ( bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1] );
