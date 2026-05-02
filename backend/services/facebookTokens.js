// Facebook token lifecycle helpers.
//
// FB user-access-tokens come in two flavours:
//   - SHORT-LIVED: 1-2 hours, default from Graph API Explorer
//   - LONG-LIVED:  60 days, obtained via /oauth/access_token?grant_type=fb_exchange_token
//
// Page tokens derived from a long-lived user token are themselves
// effectively never-expiring as long as the user remains an admin.
// Page tokens derived from a short-lived user token inherit the parent's
// 1-hour TTL, which is what's been killing publishes.
//
// This module hides the exchange so callers can just say "make sure this
// user token is long-lived" and not worry about which side they're on.

import { kvGet, kvSet } from '../db.js';

/**
 * Inspect a token via /debug_token. Returns:
 *   { isValid, isLongLived, expiresAt, errorMessage? }
 * Never throws — on network/error paths returns isValid:false.
 */
export const inspectFbToken = async (token, appId, appSecret) => {
  if (!token || !appId || !appSecret) {
    return { isValid: false, errorMessage: 'token / appId / appSecret missing' };
  }
  try {
    const appAccessToken = `${appId}|${appSecret}`;
    const r = await fetch(
      `https://graph.facebook.com/v18.0/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(appAccessToken)}`
    );
    const body = await r.json();
    const d = body?.data || {};
    if (!d.is_valid) {
      return {
        isValid: false,
        errorMessage: d.error?.message || 'token reported invalid by FB',
      };
    }
    const expiresAt = d.expires_at ? d.expires_at * 1000 : null; // ms epoch
    const ttlSeconds = d.expires_at ? d.expires_at - Math.floor(Date.now() / 1000) : Infinity;
    // FB calls anything > ~7 days a "long-lived" user token in practice.
    // Use a generous threshold so a 60-day token always counts.
    const isLongLived = ttlSeconds > 7 * 24 * 3600;
    return { isValid: true, isLongLived, expiresAt, ttlSeconds };
  } catch (err) {
    return { isValid: false, errorMessage: err.message };
  }
};

/**
 * If `token` is short-lived (or expires in <7 days), exchange it for a
 * 60-day long-lived token via /oauth/access_token. Returns the new token
 * (or the original if it was already long-lived). Throws on hard failure.
 */
export const ensureLongLivedFbToken = async (token, appId, appSecret) => {
  const probe = await inspectFbToken(token, appId, appSecret);
  if (!probe.isValid) {
    throw new Error(`Facebook token is invalid: ${probe.errorMessage}`);
  }
  if (probe.isLongLived) return { token, expiresAt: probe.expiresAt, exchanged: false };

  const url =
    `https://graph.facebook.com/v18.0/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${encodeURIComponent(appId)}` +
    `&client_secret=${encodeURIComponent(appSecret)}` +
    `&fb_exchange_token=${encodeURIComponent(token)}`;
  const r = await fetch(url);
  const data = await r.json();
  if (!r.ok || !data.access_token) {
    throw new Error(data?.error?.message || `FB exchange failed (HTTP ${r.status})`);
  }
  return {
    token: data.access_token,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : null,
    exchanged: true,
  };
};

/**
 * After we update a user's stored long-lived user token, also re-mint
 * every connected page's stored access token. Quietly swallows errors —
 * caller can decide whether to surface.
 */
export const refreshStoredPageTokens = async (userId, longLivedUserToken) => {
  try {
    const r = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category&access_token=${encodeURIComponent(longLivedUserToken)}`
    );
    const data = await r.json();
    if (!r.ok || !Array.isArray(data?.data)) return 0;

    const stored = (await kvGet(`user_facebook_pages_${userId}`)) || [];
    let updated = 0;
    const next = stored.map((p) => {
      const fresh = data.data.find((f) => f.id === p.pageId);
      if (fresh?.access_token && fresh.access_token !== p.pageAccessToken) {
        updated += 1;
        return { ...p, pageAccessToken: fresh.access_token };
      }
      return p;
    });
    if (updated > 0) await kvSet(`user_facebook_pages_${userId}`, next);
    return updated;
  } catch (err) {
    console.warn('[fb-tokens] refreshStoredPageTokens error:', err.message);
    return 0;
  }
};

/**
 * Top-level "make this user's stored FB token long-lived" routine.
 * Reads merged keys, exchanges if needed, persists, refreshes page tokens.
 * Returns { exchanged, expiresAt, refreshedPages }.
 * If the user hasn't saved appId/appSecret yet, returns { skipped:true }.
 */
export const ensureLongLivedTokenForUser = async (userId) => {
  const defaults = (await kvGet('default_api_keys')) || {};
  const userKeys = (await kvGet(`user_api_keys_${userId}`)) || {};
  const merged = { ...defaults };
  for (const [k, v] of Object.entries(userKeys)) {
    if (v != null && String(v).trim().length > 0) merged[k] = v;
  }
  const userToken = (merged.facebookAccessToken || '').trim();
  const appId = (merged.facebookAppId || '').trim();
  const appSecret = (merged.facebookAppSecret || '').trim();

  if (!userToken) return { skipped: 'no_token' };
  if (!appId || !appSecret) return { skipped: 'no_app_creds' };

  const result = await ensureLongLivedFbToken(userToken, appId, appSecret);
  if (!result.exchanged) return { exchanged: false, expiresAt: result.expiresAt };

  // Persist the new long-lived token (merge so we don't clobber other keys)
  const updated = { ...userKeys, facebookAccessToken: result.token };
  await kvSet(`user_api_keys_${userId}`, updated);

  // Re-mint stored page tokens too
  const refreshedPages = await refreshStoredPageTokens(userId, result.token);
  return { exchanged: true, expiresAt: result.expiresAt, refreshedPages };
};
