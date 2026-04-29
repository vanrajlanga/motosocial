// LinkedIn account discovery.
// Uses the user's LinkedIn access token (OAuth 2.0) to:
//   1) Fetch profile via /v2/userinfo (OpenID Connect)
//   2) Fetch organizations the user administers via /v2/organizationAcls
// Returns profile + org entries that the user can pick to connect.

import { makeConnectionStore, type ConnectedAccount } from './socialConnections';

const store = makeConnectionStore('linkedin-accounts');

export type DiscoveredLinkedInAccount = {
  urn: string; // e.g. urn:li:person:xxxx or urn:li:organization:xxxx
  kind: 'person' | 'organization';
  name: string;
  avatar?: string;
  accessToken: string;
};

// Browser -> LinkedIn direct call requires CORS. LinkedIn does enable CORS
// on /v2/userinfo but rejects it on /v2/organizationAcls. We still attempt
// both; if orgAcls fails with a network/CORS error we just return the person.
export const fetchLinkedInAccounts = async (
  accessToken: string
): Promise<DiscoveredLinkedInAccount[]> => {
  if (!accessToken?.trim()) throw new Error('LinkedIn access token is required');

  const results: DiscoveredLinkedInAccount[] = [];

  // 1) Personal profile via OpenID userinfo (needs "openid profile" scope)
  try {
    const r = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.message || `LinkedIn returned ${r.status}. Check token & scopes.`);
    }
    const me = await r.json();
    results.push({
      urn: me.sub ? `urn:li:person:${me.sub}` : '',
      kind: 'person',
      name: me.name || `${me.given_name || ''} ${me.family_name || ''}`.trim() || 'LinkedIn Profile',
      avatar: me.picture,
      accessToken,
    });
  } catch (err: any) {
    throw new Error(
      err.message || 'Failed to validate LinkedIn token. Make sure it has "openid profile" scope.'
    );
  }

  // 2) Organizations the user admins (optional — requires rw_organization_admin scope)
  try {
    const r = await fetch(
      'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&projection=(elements*(organization~(id,localizedName,vanityName,logoV2(original~:playableStreams))))',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (r.ok) {
      const data = await r.json();
      for (const el of data.elements || []) {
        const org = el['organization~'];
        if (!org) continue;
        results.push({
          urn: `urn:li:organization:${org.id}`,
          kind: 'organization',
          name: org.localizedName,
          accessToken,
        });
      }
    }
  } catch {
    // CORS or network — silently skip; personal profile still works.
  }

  return results;
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
