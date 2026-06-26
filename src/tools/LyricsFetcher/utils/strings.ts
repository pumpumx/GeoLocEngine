// ─────────────────────────────────────────────────────────────
// utils/strings.ts
// Shared string helpers used across providers and CLI.
// ─────────────────────────────────────────────────────────────

/**
 * Normalise a string for fuzzy comparison:
 * lowercase, strip punctuation, collapse whitespace.
 */
export function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Simple similarity check — true if either normalised string
 * contains the other. Useful for validating search result relevance.
 */
export function looseMatch(a: string, b: string): boolean {
  const na = normalise(a);
  const nb = normalise(b);
  return na.includes(nb) || nb.includes(na);
}

/**
 * Slugify a string for URL construction.
 * "Tum Hi Ho" → "tum-hi-ho"
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Truncate text to maxLength, appending "…" if cut.
 */
export function truncate(s: string, maxLength: number): string {
  if (s.length <= maxLength) return s;
  return s.slice(0, maxLength - 1) + "…";
}

/**
 * Strip HTML tags from a string.
 * Used as a fallback when cheerio is overkill.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Collapse excessive blank lines in lyric text to a maximum of 2.
 * Providers often return 3–4 blank lines between sections.
 */
export function normaliseWhitespace(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}