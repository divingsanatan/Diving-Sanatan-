GLOSSARY SEO UPGRADE  (SEO + GEO + AEO)
========================================
IMPORTANT: this builds on the earlier update (the shop / security update, parts 1 and 2).
Install that first if you have not already.

WHAT CHANGES FOR YOUR VISITORS AND FOR GOOGLE / AI
  - Every glossary term now has its OWN page, e.g. /blog/glossary/kundalini
    (before, all 85 terms lived on one page that loaded in the browser and
    showed only 5 terms, so search engines could not see or rank them).
  - Each term page contains: a "Quick answer" box, key takeaways, the full
    definition, in-depth explanation, origin of the word, FAQs, related terms,
    sources, and a link to book guidance.
  - Hidden behind the scenes (automatic): structured data for Google (DefinedTerm,
    FAQ, Breadcrumbs, voice "speakable" answer) and listing in your sitemap.
  - All terms are added to /llms.txt and /llm-full.txt, the files AI assistants
    (ChatGPT, Gemini, Perplexity, Claude) read.
  - Your old hand-written llms.txt files were hiding the live versions. That is fixed
    automatically; you do not need to delete anything.

WHAT CHANGES FOR YOU (Admin > Glossary)
  - SEO health dashboard: three scores for every term and your biggest gaps.
        SEO = Google search          GEO = AI answers/citations (ChatGPT, Gemini, AI Overviews)
        AEO = featured snippets, "People also ask", voice search
  - A full editor with tabs: Content | SEO | AI & answers | FAQs & links | Preview & schema.
    Every field has hints and a checklist that tells you exactly what to fix.
  - Draft / Published status, automatic redirects if you change a page address,
    and the ability to hide a term from Google (noindex).

HOW TO INSTALL
  1. Unzip. Copy the "src" and "supabase" folders AND the file "next.config.ts"
     into your project folder (Diving-Sanatan-). Say YES to Merge / Replace.
  2. Commit and push the way you normally do, and let your site redeploy.
  The database change is ALREADY applied to your live Supabase, and your 85 terms
  already have their new page addresses. Nothing to do in Supabase.

YOUR FIRST 10 MINUTES (after it is live)
  1. Admin > Glossary. You will see low scores. That is expected: the new fields are empty.
  2. Click "Fill empty basics for all". It adds a Quick answer, SEO title, meta
     description, focus keyword and related terms to every term where they are
     blank. It never changes anything you wrote. This lifts every page to a decent start.
  3. Sort by "Weakest first". Open the first term and work through the tabs:
        SEO ........ polish the title/description, add the focus keyword
        AI & answers  write the 40-60 word Quick answer, 3 key takeaways, add 2 sources,
                      a Wikipedia link, "Reviewed by" and today's date
        FAQs & links  add 3+ real questions people ask, with 2-4 sentence answers
     Aim for 80+ on each score. Start with your 10 most important terms.
  4. Google Search Console: submit your sitemap (yourwebsite/sitemap.xml) and use
     "URL inspection > Request indexing" for your best term pages.

GOOD TO KNOW
  - The scores are a practical checklist of known best practices, not Google's own
    score. They improve your chances; nobody can guarantee rankings. New pages usually
    take a few weeks to be indexed and longer to climb.
  - "Fill empty basics" makes sensible starter text from your definitions. Rewrite your
    most important terms in your own voice: original, expert content ranks and gets cited best.
