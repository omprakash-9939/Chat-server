/** Dev without VITE_API_URL: use Vite proxy (same origin as :5173) for API + Socket.IO + uploads */
export function shouldUseDevProxy() {
  return import.meta.env.DEV && !import.meta.env.VITE_API_URL;
}

export function getApiBaseUrl() {
  if (shouldUseDevProxy()) {
    return "/api";
  }
  const base = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  return `${base}/api`;
}

/** Origin used for static files (/uploads) and Socket.IO when not using full URL */
export function getPublicOrigin() {
  if (shouldUseDevProxy()) {
    return typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  }
  return (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function getSocketOrigin() {
  return getPublicOrigin();
}
