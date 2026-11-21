-- Applied to the live Supabase project on 21 Nov 2026.
-- The website only talks to the database from its server (service role key), never from the browser.
-- So no table needs open anon/public/authenticated policies. With RLS on and no policy, only the server can read or write.
-- Kept on purpose: newsletter_public_insert (validated sign-up) and shop_products_public_read (published products only).
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and policyname not in ('newsletter_public_insert', 'shop_products_public_read')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;
