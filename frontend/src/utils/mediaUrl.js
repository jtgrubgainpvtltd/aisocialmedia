const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

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

  if (/^(https?:|blob:|data:)/i.test(normalized)) {
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
