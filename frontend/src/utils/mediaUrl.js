const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// The live backend origin (e.g. "https://api.grubgain.com").
// Strips trailing /api/v1 so we can build full media URLs.
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

// Matches any localhost-based origin stored by the DB
// e.g. "http://localhost:5000" or "http://127.0.0.1:5000"
const LOCALHOST_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i;

/**
 * Resolves a raw media value (URL string from the DB, relative path, etc.)
 * to an absolute URL pointing at the live backend.
 *
 * Key fix: if the DB stored a full "http://localhost:5000/uploads/…" URL,
 * we swap the localhost origin for BACKEND_ORIGIN so images load in production.
 */
export function resolveMediaUrl(value) {
  if (!value || typeof value !== "string") {
    console.warn("[resolveMediaUrl] Invalid input:", value);
    return "";
  }

  const normalized = value.trim();
  if (!normalized) {
    console.warn("[resolveMediaUrl] Empty string after trim");
    return "";
  }

  // Passthrough for blob: / data: URIs (never need rewriting)
  if (/^(blob:|data:)/i.test(normalized)) {
    console.debug("[resolveMediaUrl] Blob/data URI — passthrough:", normalized);
    return normalized;
  }

  // Absolute http/https URL — only rewrite if it points at localhost
  if (/^https?:\/\//i.test(normalized)) {
    if (LOCALHOST_ORIGIN_RE.test(normalized)) {
      // Swap the localhost origin with the live backend origin
      const fixed = normalized.replace(LOCALHOST_ORIGIN_RE, BACKEND_ORIGIN);
      console.debug("[resolveMediaUrl] Rewrote localhost URL:", normalized, "→", fixed);
      return fixed;
    }
    // Already an absolute, non-localhost URL — use as-is
    console.debug("[resolveMediaUrl] Already absolute URL:", normalized);
    return normalized;
  }

  if (normalized.startsWith("//")) {
    const resolved = `${window.location.protocol}${normalized}`;
    console.debug("[resolveMediaUrl] Protocol-relative URL:", normalized, "→", resolved);
    return resolved;
  }

  if (normalized.startsWith("/")) {
    const resolved = `${BACKEND_ORIGIN}${normalized}`;
    console.debug("[resolveMediaUrl] Absolute path:", normalized, "→", resolved);
    return resolved;
  }

  const resolved = `${BACKEND_ORIGIN}/${normalized.replace(/^\.\//, "")}`;
  console.debug("[resolveMediaUrl] Relative path:", normalized, "→", resolved);
  return resolved;
}
