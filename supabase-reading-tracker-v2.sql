-- Reading Tracker v2: extra metadata + cover storage
alter table public.books add column if not exists author text;
alter table public.books add column if not exists genre text;
alter table public.books add column if not exists source_url text;
alter table public.books add column if not exists cover_path text;
alter table public.books add column if not exists updated_at timestamptz not null default now();

-- Keep updated_at current when a book changes.
create or replace function public.set_books_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists books_set_updated_at on public.books;
create trigger books_set_updated_at
before update on public.books
for each row execute procedure public.set_books_updated_at();

-- Cover bucket. The bucket is intentionally public so cover URLs can render directly.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('book-covers', 'book-covers', true, 6291456, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 6291456, allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

-- Public read for cover images; writes are limited to the authenticated user's folder.
drop policy if exists "Book covers public read" on storage.objects;
create policy "Book covers public read"
on storage.objects for select
to public
using (bucket_id = 'book-covers');

drop policy if exists "Book covers user upload" on storage.objects;
create policy "Book covers user upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'book-covers'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Book covers user update" on storage.objects;
create policy "Book covers user update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'book-covers'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'book-covers'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Book covers user delete" on storage.objects;
create policy "Book covers user delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'book-covers'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);