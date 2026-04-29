// Instagram Business / Creator account discovery.
// IG Business accounts are *attached to* Facebook Pages. Flow:
//   1) Get the user's FB Pages (same token as FB)
//   2) For each Page, query `instagram_business_account { id, name, username, profile_picture_url }`
//   3) Return the IG accounts we found
// Persistence uses the shared kv store via the generic connections endpoint.

import { makeConnectionStore, type ConnectedAccount } from './socialConnections';

const store = makeConnectionStore('instagram-accounts');

export type DiscoveredInstagramAccount = {
  igUserId: string;
  name: string;
  username: string;
  profilePicture?: string;
  linkedPageId: string;
  linkedPageName: string;
  pageAccessToken: string;
};

// Uses the user's FB user-access-token to find all IG Business accounts.
export const fetchInstagramAccounts = async (
  userAccessToken: string
): Promise<DiscoveredInstagramAccount[]> => {
  if (!userAccessToken?.trim()) throw new Error('Facebook access token is required');

  // 1) Get pages with their IG business account id + page token in one hop
  const pagesRes = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(
      userAccessToken
    )}`
  );
  if (!pagesRes.ok) {
    const err = await pagesRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch Facebook pages');
  }
  const pages = (await pagesRes.json())?.data ?? [];

  // 2) For each page that has an IG business account, fetch IG details
  const discovered: DiscoveredInstagramAccount[] = [];
  for (const p of pages) {
    if (!p.instagram_business_account?.id) continue;
    const igId = p.instagram_business_account.id;
    const igRes = await fetch(
      `https://graph.facebook.com/v18.0/${igId}?fields=id,username,name,profile_picture_url&access_token=${encodeURIComponent(
        p.access_token || userAccessToken
      )}`
    );
    if (!igRes.ok) continue;
    const ig = await igRes.json();
    discovered.push({
      igUserId: ig.id,
      name: ig.name || ig.username,
      username: ig.username,
      profilePicture: ig.profile_picture_url,
      linkedPageId: p.id,
      linkedPageName: p.name,
      pageAccessToken: p.access_token,
    });
  }

  if (discovered.length === 0) {
    throw new Error(
      'No Instagram Business accounts found. Your Instagram must be a Business/Creator account linked to a Facebook Page, and the token needs instagram_basic, pages_show_list, and pages_read_engagement permissions.'
    );
  }
  return discovered;
};

// Shape it into our generic ConnectedAccount before persisting
export const toConnected = (ig: DiscoveredInstagramAccount): Omit<ConnectedAccount, 'connectedAt'> => ({
  id: ig.igUserId,
  name: ig.name,
  handle: '@' + ig.username,
  accessToken: ig.pageAccessToken,
  avatar: ig.profilePicture,
  extra: { linkedPageId: ig.linkedPageId, linkedPageName: ig.linkedPageName },
});

export const loadConnectedInstagram = store.load;
export const connectInstagramAccount = (ig: DiscoveredInstagramAccount) =>
  store.connect(toConnected(ig));
export const disconnectInstagramAccount = (igUserId: string) => store.disconnect(igUserId);
