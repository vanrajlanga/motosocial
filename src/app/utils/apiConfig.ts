// Single source of truth for the backend URL.
//
// Resolution rules:
//   1. If VITE_API_URL is set to a non-empty origin (e.g. "http://localhost:4000"),
//      use it as-is. This is the dev-against-local-backend case.
//   2. If VITE_API_URL is empty / unset, fall back to SAME-ORIGIN — the
//      browser's current origin in production (Plesk reverse-proxies /api/*
//      and /uploads/* to the backend), or http://localhost:4000 only when
//      running in a non-browser environment (build-time eval, SSR, tests).
//
// IMPORTANT: an empty string in .env.production must NOT collapse to
// localhost:4000 — that was the bug that pointed every deployed user's
// browser at localhost:4000 instead of their own domain.

const raw = ((import.meta as any).env?.VITE_API_URL as string | undefined) ?? '';
const trimmed = raw.trim().replace(/\/+$/, '');

const inBrowser = typeof window !== 'undefined' && !!window.location?.origin;

export const API_ORIGIN: string = trimmed
  ? trimmed
  : inBrowser
    ? window.location.origin
    : 'http://localhost:4000';

// Prefix for the REST surface. When API_ORIGIN is the page's own origin we
// could emit a relative `/api`, but keeping the full origin makes call sites
// (esp. multipart uploads + cross-tab links) more predictable.
export const API_BASE_URL: string = `${API_ORIGIN}/api`;
