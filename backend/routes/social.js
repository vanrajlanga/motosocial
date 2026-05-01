// Server-side proxies for social-platform "discover account" calls.
//
// Why this exists:
//   LinkedIn's /v2/userinfo and /v2/organizationAcls do NOT send CORS
//   headers for browser requests, so the previous client-side approach
//   ("fetch from inside React") got blocked with "Failed to fetch".
//   Twitter/X is technically CORS-friendly on /2/users/me but only for
//   user-context tokens — broken request shapes (e.g. App-only Bearer
//   tokens) also surface as opaque CORS failures. Routing through this
//   backend gives us full HTTP visibility + clear error messages.

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ---------- LinkedIn ----------------------------------------------------
//
// POST /api/social/linkedin/discover
// Body: { accessToken: string }
// Returns: { success: true, accounts: [{ urn, kind, name, avatar?, accessToken }] }
//
// First call: /v2/userinfo (OpenID — needs `openid profile email` scope)
// Optional: /v2/organizationAcls (needs `rw_organization_admin` scope)
//
router.post('/linkedin/discover', requireAuth, async (req, res) => {
  const accessToken = (req.body?.accessToken || '').trim();
  if (!accessToken) {
    return res.status(400).json({ success: false, error: 'accessToken required' });
  }
  if (accessToken.startsWith('WPL_AP1.')) {
    return res.status(400).json({
      success: false,
      error:
        "That looks like a LinkedIn Client Secret, not an Access Token. " +
        "Generate a real access token at https://www.linkedin.com/developers/tools/oauth/token-generator " +
        "(or via your own OAuth flow). Access tokens start with 'AQ...'.",
    });
  }

  const results = [];

  // 1. Personal profile via /v2/userinfo
  try {
    const r = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      const msg =
        err.message ||
        (r.status === 401
          ? 'LinkedIn returned 401 — token is invalid or missing the openid + profile scopes.'
          : `LinkedIn returned ${r.status}.`);
      return res.status(400).json({ success: false, error: msg });
    }
    const me = await r.json();
    results.push({
      urn: me.sub ? `urn:li:person:${me.sub}` : '',
      kind: 'person',
      name:
        me.name ||
        `${me.given_name || ''} ${me.family_name || ''}`.trim() ||
        'LinkedIn Profile',
      avatar: me.picture,
      accessToken,
    });
  } catch (err) {
    return res.status(502).json({
      success: false,
      error: `Network error reaching LinkedIn: ${err.message}`,
    });
  }

  // 2. Organizations the user administers (silent fail — extra scope not
  //    everyone has)
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
    /* ignore — orgs are optional */
  }

  res.json({ success: true, accounts: results });
});

// ---------- Twitter / X -------------------------------------------------
//
// POST /api/social/twitter/discover
// Body: { accessToken: string }
//
router.post('/twitter/discover', requireAuth, async (req, res) => {
  const accessToken = (req.body?.accessToken || '').trim();
  if (!accessToken) {
    return res.status(400).json({ success: false, error: 'accessToken required' });
  }

  try {
    const r = await fetch(
      'https://api.twitter.com/2/users/me?user.fields=username,name,profile_image_url,verified',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      const msg =
        err?.errors?.[0]?.message ||
        err?.title ||
        (r.status === 401 || r.status === 403
          ? 'Twitter rejected the token. Make sure it is a USER-context OAuth 2.0 token (scopes: tweet.read, users.read), NOT an App-only Bearer token.'
          : `Twitter returned HTTP ${r.status}.`);
      return res.status(400).json({ success: false, error: msg });
    }
    const data = await r.json();
    if (!data?.data?.id) {
      return res.status(400).json({ success: false, error: 'Unexpected Twitter response' });
    }
    res.json({
      success: true,
      accounts: [
        {
          id: data.data.id,
          username: data.data.username,
          name: data.data.name || data.data.username,
          avatar: data.data.profile_image_url,
          verified: !!data.data.verified,
          accessToken,
        },
      ],
    });
  } catch (err) {
    res.status(502).json({
      success: false,
      error: `Network error reaching Twitter: ${err.message}`,
    });
  }
});

export default router;
