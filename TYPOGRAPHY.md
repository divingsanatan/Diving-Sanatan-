# Typography guide

All font sizes come from the scale in `src/app/globals.css`. Do not write raw `px`/`rem` font sizes in
components, pages, `<style jsx>` blocks or inline `fontSize` props. Use a token.

| Token | Size | Use for |
|---|---|---|
| `--fs-2xs` | 12px | badges, micro labels (smallest allowed) |
| `--fs-xs` | 13px | captions, meta, timestamps, eyebrows |
| `--fs-sm` | 14px | secondary text, buttons, chips |
| `--fs-md` | 15px | compact body, card descriptions |
| `--fs-base` | 16px | default body |
| `--fs-lg` | 18px | lead text |
| `--fs-xl` | 20px | small headings, emphasis |
| `--fs-2xl` | 20-24px (fluid) | card titles |
| `--fs-3xl` | 24-30px (fluid) | sub-section titles |
| `--fs-4xl` | 28-36px (fluid) | page/article titles |
| `--fs-5xl` | 36-48px (fluid) | large feature headings |
| `--fs-display` | 36-60px (fluid) | hero (same as h1) |
| `--fs-article` / `--fs-article-lead` | about 17-19px | long-form reading (blogs, transcripts) |

Sizes from `2xl` up are fluid, so they shrink on phones without a separate mobile override.

## Rules
1. Use the token: `font-size: var(--fs-sm);` or `style={{ fontSize: "var(--fs-sm)" }}`.
2. Or use a ready-made class: `.type-eyebrow`, `.type-section-title`, `.type-card-title`, `.type-lead`,
   `.type-body`, `.type-small`, `.type-caption`.
3. Let `h1`-`h4` take their global size. Only override a heading inside a compact component, and use a token.
4. Do not use `!important` on font sizes. If something is fighting a size, fix the specificity.
5. Fonts: headings use `var(--font-heading)` (Cormorant Garamond), everything else `var(--font-body)`
   (Plus Jakarta Sans). Never hardcode another font family.
6. Blog/transcript/editor HTML is styled once, in the "READING TYPOGRAPHY" block of `globals.css`
   (classes `.prose`, `.article-rich-content`, `.blog-content-body`, `.video-content-body`).
7. Inputs stay at 16px on phones (set globally) so iOS does not zoom on focus.

## Desktop scale
On desktop (1200px+, mouse) the whole site is rendered at 90% (`--ui-zoom: 0.9` near the end of
`globals.css`). Article text compensates for this. Set `--ui-zoom: 1` there to turn the shrink off site-wide.
