// Twitter / X account discovery.
// Uses the user's OAuth 2.0 user-context Bearer token to fetch /2/users/me.
// App-only bearer tokens WILL NOT work here — the token must have been issued
// with a user-context scope (tweet.read users.read).

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

  // X API v2 supports CORS on /2/users/me for user-context tokens.
  const r = await fetch(
    'https://api.twitter.com/2/users/me?user.fields=username,name,profile_image_url,verified',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(
      err?.errors?.[0]?.message ||
        err?.title ||
        `Twitter returned ${r.status}. The token must be a user-context OAuth 2.0 token with tweet.read + users.read scopes.`
    );
  }
  const data = await r.json();
  if (!data?.data?.id) throw new Error('Unexpected Twitter response');
  return [
    {
      id: data.data.id,
      username: data.data.username,
      name: data.data.name || data.data.username,
      avatar: data.data.profile_image_url,
      verified: !!data.data.verified,
      accessToken,
    },
  ];
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
