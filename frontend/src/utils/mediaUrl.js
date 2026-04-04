export const resolveMediaUrl = (path) => {
  if (!path) return "";

  // 1. Get the Backend Base URL (e.g., https://xyz.ngrok-free.dev)
  // We remove '/api/v1' from the end of your VITE_API_URL
  const backendBase = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

  // 2. If the path already has 'http', it might be the old 'localhost' from your local DB
  if (path.startsWith('http')) {
    return path.replace('http://localhost:5000', backendBase);
  }

  // 3. If it's a relative path (starts with /uploads), prepend the Ngrok URL
  if (path.startsWith('/')) {
    return `${backendBase}${path}`;
  }

  // 4. Fallback for paths that don't start with /
  return `${backendBase}/${path}`;
};
