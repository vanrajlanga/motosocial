import { Router } from 'express';
import { kvGet, kvSet } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { ensureLongLivedTokenForUser } from '../services/facebookTokens.js';

const router = Router();

// ------- user settings -------
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const settings = await kvGet(`user_settings_${req.user.sub}`);
    res.json({ success: true, settings: settings || {} });
  } catch (err) {
    console.error('[get settings]', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings', requireAuth, async (req, res) => {
  try {
    const { settings } = req.body || {};
    await kvSet(`user_settings_${req.user.sub}`, settings || {});
    res.json({ success: true });
  } catch (err) {
    console.error('[save settings]', err);
    res.status(500).json({ error: err.message });
  }
});

// ------- api keys -------
// GET is "soft auth" to match old behaviour (returns defaults if unauthed)
router.get('/api-keys', optionalAuth, async (req, res) => {
  try {
    const defaults = (await kvGet('default_api_keys')) || {};

    if (!req.user) {
      return res.json({ success: true, apiKeys: defaults });
    }

    const userKeys = (await kvGet(`user_api_keys_${req.user.sub}`)) || {};
    // Only let non-empty user values override defaults. An empty string in
    // the user row means "I never set this", not "force empty".
    const merged = { ...defaults };
    for (const [k, v] of Object.entries(userKeys)) {
      if (v != null && String(v).trim().length > 0) merged[k] = v;
    }
    res.json({ success: true, apiKeys: merged });
  } catch (err) {
    console.error('[get api-keys]', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/api-keys', requireAuth, async (req, res) => {
  try {
    const { apiKeys } = req.body || {};
    if (!apiKeys) return res.status(400).json({ success: false, error: 'No apiKeys provided' });
    await kvSet(`user_api_keys_${req.user.sub}`, apiKeys);

    // If a Facebook user token + App ID + App Secret are all present, silently
    // make sure the token is long-lived (60-day) before we leave. This means
    // users can paste a fresh short-lived token from Graph API Explorer and
    // never have to think about TTLs again — the system maintains itself.
    let fbAutoExtend = null;
    try {
      const r = await ensureLongLivedTokenForUser(req.user.sub);
      if (r.exchanged) {
        fbAutoExtend = {
          extended: true,
          expiresAt: r.expiresAt ? new Date(r.expiresAt).toISOString() : null,
          refreshedPages: r.refreshedPages || 0,
        };
        console.log(
          `[api-keys] auto-extended FB token for ${req.user.sub} → expires ${fbAutoExtend.expiresAt}, refreshed ${fbAutoExtend.refreshedPages} page(s)`
        );
      }
    } catch (err) {
      // Don't fail the save just because the FB exchange couldn't complete —
      // surface the reason as a soft warning so the UI can show it.
      console.warn('[api-keys] FB auto-extend skipped:', err.message);
      fbAutoExtend = { extended: false, warning: err.message };
    }

    res.json({ success: true, fbAutoExtend });
  } catch (err) {
    console.error('[save api-keys]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------- generic per-platform connection store --------------------------
// Each platform persists an array of "connected accounts" under its own key.
// Shape of each account is platform-specific; the backend just stores/loads
// the JSON blob. Validation lives on the client where the Graph/LI/X API
// responses are shaped.
const makeConnectionRoutes = (slug, kvKeyPrefix) => {
  router.get(`/${slug}`, requireAuth, async (req, res) => {
    try {
      const items = (await kvGet(`${kvKeyPrefix}_${req.user.sub}`)) || [];
      res.json({ success: true, accounts: items, pages: items });
    } catch (err) {
      console.error(`[get ${slug}]`, err);
      res.status(500).json({ error: err.message });
    }
  });

  router.post(`/${slug}`, requireAuth, async (req, res) => {
    try {
      const items = req.body?.accounts ?? req.body?.pages ?? [];
      await kvSet(`${kvKeyPrefix}_${req.user.sub}`, items);
      res.json({ success: true });
    } catch (err) {
      console.error(`[save ${slug}]`, err);
      res.status(500).json({ error: err.message });
    }
  });
};

// Facebook (kept for back-compat, same kv key it always used)
makeConnectionRoutes('facebook-pages', 'user_facebook_pages');
// New platforms
makeConnectionRoutes('instagram-accounts', 'user_instagram_accounts');
makeConnectionRoutes('linkedin-accounts', 'user_linkedin_accounts');
makeConnectionRoutes('twitter-accounts', 'user_twitter_accounts');

export default router;
