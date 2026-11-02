NEW FOOTER - install steps

1. Copy the "src" and "supabase" folders from this zip into the root of your
   project (Diving-Sanatan-), choosing "merge / replace" when asked.
   This replaces src/components/layout/Footer.tsx and adds the new files.

2. Delete these three old, unused files from your project:
     src/components/Footer.tsx
     src/components/Footer.module.css
     FOOTER-INSTALL.md

3. Database: the newsletter_subscribers table is ALREADY created on your
   Supabase project. The migration file is included only to keep your repo in sync.

4. Commit and push to GitHub, then let your host redeploy.

5. Test: open the live site, enter an email in the footer, and check that a
   row appears in the newsletter_subscribers table in Supabase.

Edit footer links, email and social handles at the top of
src/components/layout/Footer.tsx.
