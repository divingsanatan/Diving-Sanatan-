-- Newsletter subscribers captured from the site footer.
-- Insert-only for public roles; nobody can read the list except via the service role.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'footer',
  status text not null default 'subscribed',
  created_at timestamptz not null default now(),
  constraint newsletter_email_format check (
    email = lower(email) and char_length(email) between 5 and 254 and email like '%_@_%._%'
  )
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "newsletter_public_insert" on public.newsletter_subscribers;
create policy "newsletter_public_insert"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (
    status = 'subscribed'
    and email = lower(email)
    and char_length(email) between 5 and 254
  );
