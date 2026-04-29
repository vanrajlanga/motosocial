// Shared client for per-platform "connected account" persistence.
// Each service is a thin wrapper around:
//   - POST ${API_BASE_URL}/user/${endpoint}   (save list)
//   - GET  ${API_BASE_URL}/user/${endpoint}   (load list)
// and a platform-specific "discover accounts from the provider" call.

import { API_BASE_URL } from './apiConfig';
import { getAccessToken } from './authService';

export type ConnectedAccount = {
  id: string;
  name: string;
  accessToken: string;
  category?: string;
  avatar?: string;
  handle?: string;
  extra?: Record<string, any>;
  connectedAt: string;
};

const authHeaders = () => {
  const token = getAccessToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

const loadList = async (endpoint: string): Promise<ConnectedAccount[]> => {
  const token = getAccessToken();
  if (!token) return [];
  try {
    const r = await fetch(`${API_BASE_URL}/user/${endpoint}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.success) {
      return (data.accounts ?? data.pages ?? []) as ConnectedAccount[];
    }
    console.warn(`[social] GET ${endpoint} failed:`, r.status, data);
    return [];
  } catch (err) {
    console.warn(`[social] GET ${endpoint} error:`, err);
    return [];
  }
};

const saveList = async (endpoint: string, accounts: ConnectedAccount[]): Promise<boolean> => {
  const token = getAccessToken();
  if (!token) return false;
  try {
    const r = await fetch(`${API_BASE_URL}/user/${endpoint}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ accounts }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.success) return true;
    console.warn(`[social] POST ${endpoint} rejected:`, r.status, data);
    return false;
  } catch (err) {
    console.warn(`[social] POST ${endpoint} error:`, err);
    return false;
  }
};

export const makeConnectionStore = (endpoint: string) => ({
  load: () => loadList(endpoint),
  save: (accounts: ConnectedAccount[]) => saveList(endpoint, accounts),
  connect: async (account: Omit<ConnectedAccount, 'connectedAt'>) => {
    const current = await loadList(endpoint);
    if (current.some((a) => a.id === account.id)) {
      throw new Error('This account is already connected');
    }
    const withTs: ConnectedAccount = { ...account, connectedAt: new Date().toISOString() };
    const updated = [...current, withTs];
    const ok = await saveList(endpoint, updated);
    if (!ok) throw new Error('Failed to persist connection to server.');
    return updated;
  },
  disconnect: async (accountId: string) => {
    const current = await loadList(endpoint);
    const filtered = current.filter((a) => a.id !== accountId);
    const ok = await saveList(endpoint, filtered);
    if (!ok) throw new Error('Failed to persist disconnection.');
    return filtered;
  },
});
