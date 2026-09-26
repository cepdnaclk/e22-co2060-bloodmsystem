/**
 * HopeDrop Centralized API Configuration
 * Reads VITE_API_URL from environment variables in production (e.g. Render)
 * with graceful fallback to localhost for development.
 */

const rawUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000/api/v1";

// Normalizes to ensure it ends with /
export const API_BASE_URL = rawUrl.endsWith("/") ? rawUrl : `${rawUrl}/`;

// Server origin without /api/v1/ (useful for static media or health checks)
export const SERVER_ROOT_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export default API_BASE_URL;
