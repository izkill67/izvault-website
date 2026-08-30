-- IzVault Resources: private per-user cloud storage
-- Run this once in Supabase SQL Editor.

insert into storage.buckets (id, name, public)
values ('resources', 'resources', false)
on conflict (id) do update set public = false;

create policy "Resources: users can view own files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'resources'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Resources: users can upload own files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'resources'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Resources: users can update own files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'resources'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'resources'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Resources: users can delete own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'resources'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
