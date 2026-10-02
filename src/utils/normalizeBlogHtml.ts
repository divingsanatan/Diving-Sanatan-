// Inline styles that survive from admin content (fonts, sizes, colors pasted from Word/Docs/other sites).
const KEEP_STYLE_PROPS = new Set(["text-align"]);
const PRESENTATIONAL_ATTR = /\s(?:face|size|color|bgcolor)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const STYLE_ATTR = /\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

function cleanStyle(_match: string, dq?: string, sq?: string): string {
  const kept = (dq ?? sq ?? "")
    .split(";")
    .map((decl) => decl.trim())
    .filter((decl) => KEEP_STYLE_PROPS.has(decl.split(":")[0].trim().toLowerCase()));
  return kept.length ? ` style="${kept.join("; ")}"` : "";
}

/**
 * Strips font family/size/color overrides from stored blog HTML so every post renders
 * with the site's typography. String-based so server and client output match.
 */
export function normalizeBlogHtml(html: string): string {
  if (!html) return html;
  return html
    .replace(/<\/?font\b[^>]*>/gi, "")
    .replace(/<[a-z][a-z0-9-]*\b[^>]*>/gi, (tag) =>
      tag.replace(PRESENTATIONAL_ATTR, "").replace(STYLE_ATTR, cleanStyle)
    );
}
