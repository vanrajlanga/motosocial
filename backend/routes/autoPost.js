// Auto-post configuration + schedule generation + run-now (manual trigger).
// Cron worker also lives in this file's process so the in-memory state stays
// simple — but the worker itself is wired in server.js.

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool, kvGet, kvSet } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { generateAndPublishNow } from '../services/contentPipeline.js';

const router = Router();

const DEFAULT_CONFIG = {
  enabled: false,
  posts_per_day: 2,
  posting_times: ['09:00', '18:00'],
  caption_size: 'GNP',
  last_keyword_index: 0,
};

const parseTimes = (val) => {
  try {
    const arr = typeof val === 'string' ? JSON.parse(val) : val;
    if (Array.isArray(arr)) return arr;
  } catch {}
  return DEFAULT_CONFIG.posting_times;
};

router.get('/config', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM auto_post_config WHERE user_id = ?',
      [req.user.sub]
    );
    if (rows.length === 0) {
      return res.json({ success: true, config: DEFAULT_CONFIG });
    }
    const r = rows[0];
    res.json({
      success: true,
      config: {
        enabled: !!r.enabled,
        posts_per_day: r.posts_per_day,
        posting_times: parseTimes(r.posting_times),
        caption_size: r.caption_size,
        last_keyword_index: r.last_keyword_index,
        updated_at: r.updated_at,
      },
    });
  } catch (err) {
    console.error('[auto-post:config:get]', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/config', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const enabled = !!body.enabled;
    const postsPerDay = Math.max(1, Math.min(24, Number(body.posts_per_day) || 2));
    let times = Array.isArray(body.posting_times) ? body.posting_times : DEFAULT_CONFIG.posting_times;
    times = times
      .filter((t) => /^\d{2}:\d{2}$/.test(t))
      .slice(0, postsPerDay);
    if (times.length === 0) times = DEFAULT_CONFIG.posting_times.slice(0, postsPerDay);
    const captionSize = ['HE', 'GNP', 'GIP'].includes(body.caption_size) ? body.caption_size : 'GNP';

    await pool.query(
      `INSERT INTO auto_post_config
         (user_id, enabled, posts_per_day, posting_times, caption_size)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         enabled = VALUES(enabled),
         posts_per_day = VALUES(posts_per_day),
         posting_times = VALUES(posting_times),
         caption_size = VALUES(caption_size)`,
      [req.user.sub, enabled ? 1 : 0, postsPerDay, JSON.stringify(times), captionSize]
    );
    res.json({
      success: true,
      config: { enabled, posts_per_day: postsPerDay, posting_times: times, caption_size: captionSize },
    });
  } catch (err) {
    console.error('[auto-post:config:save]', err);
    res.status(500).json({ error: err.message });
  }
});

// Build the upcoming schedule by stamping `pending` rows into scheduled_posts.
// We don't pick the keyword here — the cron worker will pick at fire time
// (round-robin). We just allocate the time slots so the calendar UI can
// preview what's coming.
//
// Body: { days?: number = 14 } — how many days to plan ahead.
router.post('/schedule', requireAuth, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(60, Number(req.body?.days) || 14));

    const [cfgRows] = await pool.query(
      'SELECT enabled, posts_per_day, posting_times, caption_size FROM auto_post_config WHERE user_id = ?',
      [req.user.sub]
    );
    if (cfgRows.length === 0) {
      return res.status(400).json({ success: false, error: 'Save auto-post config first.' });
    }
    const cfg = cfgRows[0];
    const times = parseTimes(cfg.posting_times);

    const [keywords] = await pool.query(
      'SELECT id, keyword FROM keywords WHERE user_id = ? ORDER BY position ASC, created_at ASC',
      [req.user.sub]
    );
    if (keywords.length === 0) {
      return res.status(400).json({ success: false, error: 'Add at least one keyword first.' });
    }

    // Wipe future pending rows so re-scheduling is idempotent
    await pool.query(
      `DELETE FROM scheduled_posts
       WHERE user_id = ? AND status = 'pending' AND scheduled_for >= NOW()`,
      [req.user.sub]
    );

    const now = new Date();
    const plan = [];
    let kwIndex = 0;

    for (let d = 0; d < days; d++) {
      for (const t of times) {
        const [hh, mm] = t.split(':').map(Number);
        const slot = new Date(now);
        slot.setDate(slot.getDate() + d);
        slot.setHours(hh, mm, 0, 0);
        if (slot.getTime() <= now.getTime()) continue; // skip past slots today
        const kw = keywords[kwIndex % keywords.length];
        kwIndex += 1;
        plan.push({ id: uuidv4(), keyword: kw.keyword, scheduledFor: slot });
      }
    }

    if (plan.length === 0) {
      return res.json({ success: true, scheduled: 0, message: 'Nothing to schedule.' });
    }

    const values = plan.map((p) => [
      p.id,
      req.user.sub,
      p.keyword,
      cfg.caption_size,
      p.scheduledFor,
      'pending',
      p.keyword,
    ]);

    await pool.query(
      `INSERT INTO scheduled_posts (id, user_id, keyword, caption_size, scheduled_for, status, title)
       VALUES ?`,
      [values]
    );

    res.json({ success: true, scheduled: plan.length, days, postsPerDay: times.length });
  } catch (err) {
    console.error('[auto-post:schedule]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Manual "post right now" — useful for testing the pipeline.
router.post('/run-now', requireAuth, async (req, res) => {
  try {
    const captionSize = ['HE', 'GNP', 'GIP'].includes(req.body?.caption_size)
      ? req.body.caption_size
      : 'GNP';
    const result = await generateAndPublishNow(req.user.sub, captionSize, process.env.PORT || 4000);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[auto-post:run-now]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auto-post/refresh-fb-token
// ─────────────────────────────────────────────────────────────────────────────
// Exchanges the user's currently-saved short-lived Facebook user-access-token
// for a long-lived one (~60 days) using the user's saved Facebook App ID +
// App Secret. Writes the new token back into kv_store, then refreshes every
// connected Page's stored access token (which become never-expiring once
// derived from a long-lived user token).
//
// Body: { token?: string }   — optional; if omitted we use whatever is saved.
//
// Pre-reqs in Settings → API Keys:
//   - facebookAppId
//   - facebookAppSecret
//   - facebookAccessToken (the short-lived one to extend)
//
// Returns the new token + expiry timestamp.
router.post('/refresh-fb-token', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;

    const defaults = (await kvGet('default_api_keys')) || {};
    const userKeys = (await kvGet(`user_api_keys_${userId}`)) || {};
    const merged = { ...defaults };
    for (const [k, v] of Object.entries(userKeys)) {
      if (v != null && String(v).trim().length > 0) merged[k] = v;
    }

    const appId = (merged.facebookAppId || '').trim();
    const appSecret = (merged.facebookAppSecret || '').trim();
    const inputToken = (req.body?.token || merged.facebookAccessToken || '').trim();

    if (!appId || !appSecret) {
      return res.status(400).json({
        success: false,
        error:
          'Save your Facebook App ID and App Secret in Settings → API Keys first. ' +
          'You can find both in your Meta App dashboard → Settings → Basic.',
      });
    }
    if (!inputToken) {
      return res.status(400).json({
        success: false,
        error: 'Save a Facebook user access token in Settings → API Keys first.',
      });
    }

    // 1. Exchange short-lived → long-lived
    const exchangeUrl =
      `https://graph.facebook.com/v18.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${encodeURIComponent(appId)}` +
      `&client_secret=${encodeURIComponent(appSecret)}` +
      `&fb_exchange_token=${encodeURIComponent(inputToken)}`;

    const exRes = await fetch(exchangeUrl);
    const exData = await exRes.json();
    if (!exRes.ok || !exData.access_token) {
      return res.status(400).json({
        success: false,
        error: exData?.error?.message || `Facebook exchange failed (HTTP ${exRes.status})`,
      });
    }
    const longLivedToken = exData.access_token;
    const expiresInSeconds = exData.expires_in || 0;
    const expiresAt = expiresInSeconds
      ? new Date(Date.now() + expiresInSeconds * 1000).toISOString()
      : null;

    // 2. Save back to user_api_keys
    const updatedKeys = { ...userKeys, facebookAccessToken: longLivedToken };
    await kvSet(`user_api_keys_${userId}`, updatedKeys);

    // 3. Refresh page tokens — page tokens derived from a long-lived user
    //    token are themselves never-expiring (as long as the user remains
    //    an admin of the page).
    let refreshedPages = 0;
    try {
      const pagesRes = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category&access_token=${encodeURIComponent(longLivedToken)}`
      );
      const pagesData = await pagesRes.json();
      if (pagesRes.ok && Array.isArray(pagesData?.data)) {
        const stored = (await kvGet(`user_facebook_pages_${userId}`)) || [];
        const updatedPages = stored.map((p) => {
          const fresh = pagesData.data.find((f) => f.id === p.pageId);
          if (fresh?.access_token && fresh.access_token !== p.pageAccessToken) {
            refreshedPages += 1;
            return { ...p, pageAccessToken: fresh.access_token };
          }
          return p;
        });
        if (refreshedPages > 0) {
          await kvSet(`user_facebook_pages_${userId}`, updatedPages);
        }
      }
    } catch (err) {
      console.warn('[refresh-fb-token] page-refresh step failed:', err.message);
    }

    res.json({
      success: true,
      tokenPreview: `${longLivedToken.slice(0, 14)}…${longLivedToken.slice(-6)}`,
      expiresAt,
      expiresInDays: expiresInSeconds ? Math.floor(expiresInSeconds / 86400) : null,
      refreshedPages,
    });
  } catch (err) {
    console.error('[refresh-fb-token]', err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

export default router;
