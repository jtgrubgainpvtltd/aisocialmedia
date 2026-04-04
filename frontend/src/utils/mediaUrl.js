export const resolveMediaUrl = (path) => {
  if (!path) return "";

  // The live backend base URL, e.g. "https://xyz.ngrok-free.app"
  const backendBase = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

  if (path.startsWith('http')) {
    // If the URL already points to our current backend — use as-is
    if (path.startsWith(backendBase)) {
      return path;
    }

    // For ANY other absolute URL (localhost, old Ngrok, old VDI IP, etc.)
    // strip the foreign origin and keep only the /uploads/... path portion,
    // then prepend the current live backend.
    try {
      const url = new URL(path);
      return `${backendBase}${url.pathname}`;
    } catch {
      // Fallback: dumb replace for malformed URLs
      return path.replace(/^https?:\/\/[^/]+/, backendBase);
    }
  }

  // Relative path starting with / (e.g. /uploads/image.png)
  if (path.startsWith('/')) {
    return `${backendBase}${path}`;
  }

  // Relative path without leading slash
  return `${backendBase}/${path}`;
};
