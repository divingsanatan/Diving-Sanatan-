>>> THIS IS PART 1 OF 2 <<<
>>> Upload BOTH parts into your project before the site is redeployed. <<<
>>> (If GitHub shows a failed deploy after the first part, that is normal. It fixes itself once both parts are uploaded.) <<<

DIVING SANATAN - FULL UPDATE (shop + checkout + security fixes)
================================================================
This zip REPLACES every earlier zip I gave you (shop, header, footer). Install
only this one. It contains everything.

WHAT YOU GET
  1. Shop with cart, secure checkout, online payment and order tracking
  2. Admin screens: Shop (products + SEO) and Shop Orders
  3. New header and footer (with Shop links) and working newsletter signup
  4. Security fixes for problems I found in the existing site (listed below)
  5. Real "page not found" answers for missing pages, and the correct .online
     website address everywhere

STEP 1 - COPY THE FILES (do this for BOTH zip files)
  Unzip. Copy the "src" and "supabase" folders into your project folder
  (Diving-Sanatan-). Say YES to Merge / Replace.

STEP 2 - DELETE ONE FILE (this is what gives real "404 not found" answers)
  In your project, delete the file:   src/app/loading.tsx
  (If you forget, nothing breaks. The site just keeps the old behaviour.)

STEP 3 - SETTINGS ON YOUR HOSTING WEBSITE (e.g. Vercel > Settings > Environment Variables)
  REQUIRED
     ADMIN_TOKEN_SECRET   any long made-up text, 32+ letters/numbers. Keep it private.
  ALREADY IN USE (check they are set; the site needs them)
     NEXT_PUBLIC_GOOGLE_CLIENT_ID   your Google sign-in ID. Google login will not work without it.
     RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET   your Razorpay keys (same ones your bookings use)
     SUPABASE_SERVICE_ROLE_KEY      your Supabase service key
  OPTIONAL (shop)
     SHOP_SHIPPING_FEE         e.g. 80   (default is free shipping)
     SHOP_FREE_SHIPPING_OVER   e.g. 999  (shipping becomes free above this amount)
     ADMIN_EMAIL               where "new order" emails are sent
  Save, then redeploy.

STEP 4 - PUBLISH
  Commit and push to GitHub the way you normally do.

STEP 5 - EVERYONE MUST SIGN IN AGAIN ONCE
  After this update, every member and admin must log out and log in again one time.
  (Login is now verified by the server, so old browser logins stop working for
  anything private, such as admin screens, profile and booking history.)
  Go to  yourwebsite/admin/login  to sign in as admin.

STEP 6 - TRY IT
  - Admin > Shop > Add product (set Status to Published) and look at /shop
  - Buy it yourself with a test Razorpay payment, then open Admin > Shop Orders
  - If Razorpay is not set up, orders are still saved as "pay later" orders and
    you contact the customer yourself.

SECURITY PROBLEMS FIXED (found while checking the existing site)
  - Anyone could change any person's password (including the admin's) with no login.
  - "Sign in with Google" trusted whatever email the browser sent, so anyone could
    sign in as the admin. The server now checks with Google itself.
  - All admin actions (users, leads, blogs, services, SEO tools, uploads and more)
    could be used by anyone. They now require a verified login with the right role.
  - Customers could set their own price when paying, and a "pay by card" test
    path marked bookings as paid without payment. Prices now come only from your
    database, and a booking is marked paid only after Razorpay's payment is verified.
  - Every customer's name, email and phone were visible to anyone. Now only the
    customer and your team see them. (Public pages only see which time slots are taken.)
  - File upload accepted any file. Now only real images and videos from admins.
  - Passwords were stored with a weak method. They are now stored with a strong salted
    method and old passwords upgrade automatically the next time each person logs in.
  - New healer accounts used a guessable default password ("Healer@123"). Now a
    random one is generated and shown to you once after saving.
  - Locked: staff and healer profiles can no longer be taken over through sign-up.
  - Login, sign-up and payment attempts are now rate-limited.

THINGS TO KNOW
  - Removing src/app/loading.tsx removes the grey loading skeleton that flashed between
    pages. Pages still load the same; only that animation is gone.
  - Gurus can still add and edit services, blogs and practitioners, but cannot see
    users, leads, bookings management or SEO tools (staff only).
  - Email addresses on the site still use @divingsanatan.com. Check that is your real email domain.
  - Old unused files can stay: src/components/Footer.tsx, Footer.module.css,
    src/utils/adminToken.ts. They do nothing.
