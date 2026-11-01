/**
 * Clean a pasted Personal API key.
 * Users often paste quotes, "ApiKey " prefix, or newlines from docs/email.
 */
export function normalizeGarminApiKey(raw: string): string {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  // Docs show: Authorization: ApiKey [your-api-key]
  if (/^apikey\s+/i.test(key)) {
    key = key.replace(/^apikey\s+/i, '').trim();
  }
  if (key.startsWith('[') && key.endsWith(']')) {
    key = key.slice(1, -1).trim();
  }
  // Collapse internal whitespace/newlines from multiline paste.
  key = key.replace(/\s+/g, '');
  return key;
}
