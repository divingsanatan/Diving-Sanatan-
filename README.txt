SHOP + NEW HEADER + NEW FOOTER   (everything in one zip, no code editing needed)
================================================================================

WHAT YOU GET
  - A shop at /shop, and an admin "Shop" section where you add products, photos,
    prices, details and SEO settings
  - The new header (menu bar) and new footer, with "Shop" already added to both
  - Working newsletter sign-up in the footer
  - Shop products automatically added to your sitemap for Google

HOW TO INSTALL (4 steps)

  STEP 1: Copy the files
     Unzip this file. You will see a folder called "shop" containing two folders:
     "src" and "supabase".
     Copy those two folders into your project folder (the one called
     Diving-Sanatan-). If your computer asks about merging or replacing, say
     YES / Merge / Replace.

  STEP 2: Add one secret setting on your hosting website
     Open your hosting dashboard (for example Vercel), go to your project, then
     Settings > Environment Variables, and add:
        Name:   ADMIN_TOKEN_SECRET
        Value:  any long made-up text, at least 32 letters and numbers
                (example: mY-s3cret-Diving-Sanatan-2026-xK9pQ2wL7vB4nR8)
     Keep it private. Save it.

  STEP 3: Upload and publish
     Commit and push the project to GitHub the way you normally do, so your site
     redeploys. (After you add the setting in Step 2, make sure the site
     redeploys at least once.)

  STEP 4: Sign in again, then add your first product
     Go to  yourwebsite/admin/login  and sign in again (needed once).
     Then: left menu > Shop > Add product. Fill in the tabs, set Status to
     "Published", and click Create product. Your shop is at yourwebsite/shop.

YOU DO NOT NEED TO DO ANYTHING IN SUPABASE
  The shop's database table is already created on your project. The files in
  the "supabase" folder just keep your project copy in sync.

TIPS FOR SEO (inside each product, "SEO" tab)
  - Type the phrase people would search for into "Focus keyword".
  - Click "Suggest" next to the title and description, then adjust the wording.
  - Aim for a green SEO score (80+) before publishing.
  - Add a description with 150+ words and a short description on every image.

WHAT CHANGED IN YOUR PROJECT (for your records)
  NEW    src/app/shop/...              the public shop pages
  NEW    src/app/admin/shop/...        the admin Shop section
  NEW    src/app/api/shop/...          secure behind-the-scenes shop functions
  NEW    src/app/api/newsletter/...    footer newsletter sign-up
  NEW    src/lib/shop*.ts, src/utils/adminToken.ts, src/utils/sanitizeHtml.ts
  NEW    supabase/migrations/...       (database notes, already applied)
  NEW    src/components/layout/Header.tsx + Header.module.css   new menu bar
  NEW    src/components/layout/Footer.tsx + Footer.module.css   new footer
  EDIT   admin sidebar, admin login, sitemap, robots
  EDIT   src/app/blog/BlogContext.tsx + src/components/providers/GlobalSearchProvider.tsx
         = makes pages readable by Google right away (recommended).

OLD FILES YOU CAN IGNORE
  An unused older footer may still sit in your project (src/components/Footer.tsx,
  Footer.module.css, FOOTER-INSTALL.md). It is not used and does no harm.
