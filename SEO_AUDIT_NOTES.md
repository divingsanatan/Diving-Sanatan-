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

## Needs a decision or a manual step
- Case studies page is written into the code and now kept out of search until the cases are confirmed real and consented.
- Comparison pages have no data table; kept out of search.
- Service records look like sample data (practitioner names that are not in the practitioners table, ratings not backed by
  reviews, picture keywords instead of pictures, empty benefits and process lists). Replace with real details.
- Three blog articles have no TL;DR.
- Vercel: add www.divingsanatan.online (with DNS) redirecting to the main address, and make the vercel.app address redirect
  permanently (308) instead of 307.
- Google Search Console and Bing Webmaster Tools: verify the site and submit /sitemap.xml.
