// Twitter / X account discovery.
// Goes through our backend (/api/social/twitter/discover) for the same
// CORS-avoidance reason as LinkedIn.

import { API_BASE_URL } from './apiConfig';
import { getAccessToken } from './authService';
import { makeConnectionStore, type ConnectedAccount } from './socialConnections';

const store = makeConnectionStore('twitter-accounts');

export type DiscoveredTwitterAccount = {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  verified?: boolean;
  accessToken: string;
};

export const fetchTwitterAccount = async (
  accessToken: string
): Promise<DiscoveredTwitterAccount[]> => {
  if (!accessToken?.trim()) throw new Error('Twitter/X access token is required');

  const jwt = getAccessToken();
  const r = await fetch(`${API_BASE_URL}/social/twitter/discover`, {
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
  return (data.accounts || []) as DiscoveredTwitterAccount[];
};

export const toConnectedTW = (
  acc: DiscoveredTwitterAccount
): Omit<ConnectedAccount, 'connectedAt'> => ({
  id: acc.id,
  name: acc.name,
  handle: '@' + acc.username,
  accessToken: acc.accessToken,
  avatar: acc.avatar,
  extra: { verified: acc.verified, username: acc.username },
});

export const loadConnectedTwitter = store.load;
export const connectTwitterAccount = (acc: DiscoveredTwitterAccount) =>
  store.connect(toConnectedTW(acc));
export const disconnectTwitterAccount = (id: string) => store.disconnect(id);
