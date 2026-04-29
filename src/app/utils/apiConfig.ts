// Single source of truth for the backend URL.
// Override in .env with VITE_API_URL (e.g. VITE_API_URL=http://localhost:4000)

const raw = (import.meta as any).env?.VITE_API_URL as string | undefined;

// Keep as origin (no trailing slash, no /api)
export const API_ORIGIN: string = (raw || 'http://localhost:4000').replace(/\/+$/, '');

// Prefix for the new REST surface
export const API_BASE_URL: string = `${API_ORIGIN}/api`;
