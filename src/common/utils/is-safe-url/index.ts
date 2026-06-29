const ALLOWED_SCHEMES = ['http:', 'https:'];
const DANGEROUS_SCHEME_RE = /^[a-z][a-z\d+\-.]*:/i;

/**
 * Returns true if the given URL string uses a safe scheme (http or https).
 * Relative paths (no scheme) are always considered safe.
 * Rejects dangerous schemes like javascript:, data:, vbscript:, etc.
 */
export const isSafeUrl = (url: string): boolean => {
  if (!DANGEROUS_SCHEME_RE.test(url)) {
    return true;
  }

  try {
    const parsed = new URL(url);

    return ALLOWED_SCHEMES.includes(parsed.protocol);
  } catch {
    return false;
  }
};
