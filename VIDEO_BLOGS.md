# Video Blogs (vertical-first, with SEO / GEO / AEO)

Videos used to be rows in the general `blogs` table, shown by two client-only pages with demo fallbacks (including a
placeholder prank video). They now live in their own table, `video_posts`, with real server-rendered pages.

## What a visitor sees
- `/blog/video-transcripts`: a redesigned hub. Hero with the featured video in a phone-style frame, a Subscribe button,
  topic and shape filters, a grid of tall 9:16 posters (horizontal videos get a wide card), and a pop-up player with
  previous/next and "jump to" moments. Crawlers get every title, link and summary in the HTML.
- `/blog/video-transcripts/<slug>`: one page per video. Vertical videos use a tall sticky player beside the text,
  horizontal videos a wide player on top. It has a summary, key takeaways, a timestamped transcript (tap a time to jump
  the video there), the written article, questions answered, sources, related videos, share buttons and Subscribe.
- YouTube is only loaded when the visitor presses play (privacy-friendly `youtube-nocookie.com`), so pages stay fast.

## Subscribe button
It is a plain link to `https://www.youtube.com/@divingsanatan?sub_confirmation=1`. YouTube then shows a one-click
"Subscribe?" prompt to signed-in viewers. No website can subscribe someone without that confirmation on youtube.com.
The channel address is set in ONE place: `src/lib/youtube.ts` (`YOUTUBE_CHANNEL_URL`). It also feeds the schema
markup (`sameAs`), the sitemap and the AI files.

## Deploy order (important)
1. Run `supabase/migrations/20261115000000_video_posts.sql` in the Supabase SQL editor (safe to re-run).
2. Deploy the code.
3. Admin > Video Blogs > **Import from blog posts**. Existing video posts with a real YouTube link are copied over
   (originals are untouched), and each live one's old `/blog/...` address redirects (301) to its new page.
4. Open each imported video and check its **shape**. Imports start as vertical; switch any horizontal one.
5. Add transcripts (paste the captions from YouTube Studio), then click **Fill empty basics for all**.

Until the SQL runs, the video page simply shows no videos (it will not break).

## Rules
- Tables are **server only** (RLS on, no public policies). Only staff can add, edit, publish, import or delete.
- Each YouTube video can be on the list once. Only one video can be "featured".
- Changing a live video's address creates a 301 redirect automatically.
- Drafts and `noindex` videos are never in the sitemap, `llms.txt` or `llm-full.txt`.
- Likes and comments on the old video pages are not part of the new pages (they used the old, unverified
  identity pattern). Add them later using the Q&A comment system if wanted.

## Where things live
| What | File |
|---|---|
| YouTube link parsing, channel address, player addresses | `src/lib/youtube.ts` |
| Types, transcript parsing, scoring, VideoObject JSON-LD | `src/lib/videoShared.ts` |
| Reads, validation, fill blanks, import converter | `src/lib/videoServer.ts` |
| API | `src/app/api/videos/route.ts`, `.../bulk-seo/route.ts`, `.../import/route.ts` |
| Hub, pop-up player, cards, styles | `src/app/blog/video-transcripts/` (`page.tsx`, `VideoHubClient.tsx`, `VideoPlayer.tsx`, `SubscribeButton.tsx`, `video.module.css`) |
| Video page | `src/app/blog/video-transcripts/[slug]/` |
| Admin | `src/app/admin/video-blogs/` |
| Sitemap (with video entries), llms.txt, llm-full.txt | `src/app/sitemap.ts`, `src/app/llms.txt/route.ts`, `src/app/llm-full.txt/route.ts` |
