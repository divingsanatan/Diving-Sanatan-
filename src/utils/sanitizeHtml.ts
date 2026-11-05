/**
 * Allow-list HTML sanitiser for product descriptions (server and client safe, no DOM).
 * Keeps basic formatting only; every attribute is dropped except a safe <a href>.
 */
const ALLOWED = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li",
  "h2", "h3", "h4", "blockquote", "a",
]);

// Rich-text editors often emit these; map them to allowed equivalents so text isn't flattened.
const RENAME: Record<string, string> = { div: "p", h1: "h2", h5: "h4", h6: "h4", strike: "", s: "", del: "" };

const escapeText = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");

function safeHref(raw: string): string | null {
  const href = raw.trim().replace(/&amp;/g, "&");
  if (/^(https?:\/\/|mailto:|\/(?!\/))/i.test(href)) return href.replace(/"/g, "%22");
  return null;
}

export function sanitizeHtml(input: string): string {
  if (!input) return "";
  let html = String(input);

  // Remove dangerous elements together with their content, plus comments.
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  html = html.replace(/<(script|style|iframe|object|embed|noscript|template|svg|math)\b[\s\S]*?<\/\1\s*>/gi, "");
  html = html.replace(/<(script|style|iframe|object|embed|noscript|template|svg|math)\b[^>]*>/gi, "");

  let out = "";
  let last = 0;
  const tagRe = /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html))) {
    out += escapeText(html.slice(last, m.index));
    last = m.index + m[0].length;

    const closing = m[1] === "/";
    let name = m[2].toLowerCase();
    if (name in RENAME) name = RENAME[name];
    if (!name || !ALLOWED.has(name)) continue; // drop the tag, keep its text

    if (closing) {
      out += name === "br" ? "" : `</${name}>`;
    } else if (name === "br") {
      out += "<br>";
    } else if (name === "a") {
      const hrefMatch = m[3].match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = hrefMatch ? safeHref(hrefMatch[2] ?? hrefMatch[3] ?? hrefMatch[4] ?? "") : null;
      out += href ? `<a href="${href}" rel="noopener noreferrer nofollow">` : "<a>";
    } else {
      out += `<${name}>`;
    }
  }
  out += escapeText(html.slice(last));
  return out;
}
