// LinkedIn account discovery.
// Now goes through our backend (/api/social/linkedin/discover) because
// LinkedIn doesn't send CORS headers for /v2/* — direct browser calls are
// blocked.

import { API_BASE_URL } from './apiConfig';
import { getAccessToken } from './authService';
import { makeConnectionStore, type ConnectedAccount } from './socialConnections';

const store = makeConnectionStore('linkedin-accounts');

export type DiscoveredLinkedInAccount = {
  urn: string; // e.g. urn:li:person:xxxx or urn:li:organization:xxxx
  kind: 'person' | 'organization';
  name: string;
  avatar?: string;
  accessToken: string;
};

export const fetchLinkedInAccounts = async (
  accessToken: string
): Promise<DiscoveredLinkedInAccount[]> => {
  if (!accessToken?.trim()) throw new Error('LinkedIn access token is required');

  const jwt = getAccessToken();
  const r = await fetch(`${API_BASE_URL}/social/linkedin/discover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: JSON.stringify({ accessToken }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.success) {
    throw new Error(data.error || `Backend returned ${r.status}`);
  }
  return (data.accounts || []) as DiscoveredLinkedInAccount[];
};

export const toConnectedLI = (
  acc: DiscoveredLinkedInAccount
): Omit<ConnectedAccount, 'connectedAt'> => ({
  id: acc.urn,
  name: acc.name,
  accessToken: acc.accessToken,
  avatar: acc.avatar,
  category: acc.kind === 'organization' ? 'Organization' : 'Personal profile',
  extra: { urn: acc.urn, kind: acc.kind },
});

export const loadConnectedLinkedIn = store.load;
export const connectLinkedInAccount = (acc: DiscoveredLinkedInAccount) =>
  store.connect(toConnectedLI(acc));
export const disconnectLinkedInAccount = (urn: string) => store.disconnect(urn);
