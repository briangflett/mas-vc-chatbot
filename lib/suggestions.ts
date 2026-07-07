/**
 * Parse the trailing `<<question one|question two|...>>` follow-up block the
 * agent appends to every answer (see the system prompt), splitting it off from
 * the visible message body. Kept in its own module so it's unit-testable without
 * a DOM.
 */
export function splitSuggestions(text: string): { body: string; suggestions: string[] } {
  const m = text.match(/<<([^>]*)>>\s*$/);
  if (!m) return { body: text, suggestions: [] };
  const suggestions = m[1]
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  return { body: text.slice(0, m.index).trimEnd(), suggestions };
}
