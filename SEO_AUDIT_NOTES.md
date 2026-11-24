# SEO, AEO and GEO checks (21 Nov 2026)

Checked on a local copy of the built site with sample data: titles, canonical links, robots rules, headings,
structured data, text present in the server HTML, redirects, noindex headers and the sitemap.

## Fixed in code
- Service pages (/services/<id>) used to send visitors straight to the booking page. They are now real pages
  (details, benefits, process, real reviews, Book button) with Service markup. Ratings come only from real review rows.
- Practitioner list and profile pages, and the services lists, are now built on the server with titles, canonical links
  and structured data. Every service and profile has a plain link to it.
- Blog articles are built on the server with Article markup; titles no longer get the brand name twice.
- Site-wide Organization and WebSite markup now use one brand name ("Diving Sanatan") and link the YouTube channel.
- robots.txt: one clear list of private areas for all crawlers, search and AI bots (incl. OAI-SearchBot, Claude-SearchBot,
  Perplexity-User, Applebot), and the sitemap address.
- Private pages (admin, api, profile, cart, checkout, booking, search, order pages, topic previews) get noindex on the page
  and in the response header.
- Sitemap: only published pages, real edit dates (no "today" on every page), no duplicates, no /booking, practitioners added,
  articles listed at the same address they name as canonical.
- /services/explore (a copy of /explore-services) now redirects there. Explore-services has a main heading.
- Canonical links added to home, about, contact, services, reviews, privacy, gurus.
- Search descriptions are always cleaned to plain text (no tags, markdown, emoji).

## Fixed in the database
- 3 blog meta descriptions held raw HTML and markdown. Cleaned. Two over-long or broken page titles shortened.

## Removed completely (22 Nov 2026)
- Case studies and comparison pages: pages, API, menu and footer links, types and the unused media carousel.
  Old addresses (/blog/case-studies, /blog/comparison, /comparisons) permanently redirect to /blog.

## Article fixes (database)
- The main Tantra article was pasted with markdown marks and had no real headings. It now has 14 section headings, 16
  sub-headings and proper lists; every word was checked to be unchanged. The original is kept in the table blog_content_backups.
- TL;DRs written for the three articles that had none. Empty headings, stray editor comments and a self-link were cleaned.

## Still open
- Service records look like sample data. Replace with real details when you work on the services pages.
- Vercel: www.divingsanatan.online is added and redirects (308) to the main address. It starts working once the DNS record
  below is added at Namecheap.

## Deleting old files from the repo (they are no longer used)
src/app/blog/case-studies/  src/app/blog/comparison/  src/app/api/comparisons/  src/components/ui/MediaCarousel.tsx
supabase/migrations/20260625000000_comparison_pages.sql  src/app/blog/BlogListingClient.tsx  src/app/blog/pillar/PillarListingClient.tsx
