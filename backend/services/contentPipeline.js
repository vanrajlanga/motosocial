// Server-side content pipeline used by the cron auto-publisher and the
// on-demand "run now" endpoint. Mirrors the frontend Create Post flow:
//   keyword -> OpenAI caption -> Imagen image -> FB Graph multipart publish
//
// Reads API keys + connected pages from kv_store, so it works without any
// frontend involvement. Returns a structured result the caller can persist
// into scheduled_posts.

import fs from 'fs';
import path from 'path';
import { Blob } from 'buffer';
import { v4 as uuidv4 } from 'uuid';
import { pool, kvGet } from '../db.js';
import { ensureLongLivedTokenForUser } from './facebookTokens.js';

const UPLOADS_DIR = path.resolve('uploads');

// ---------- API key + connection helpers ----------
const getEffectiveKeys = async (userId) => {
  const defaults = (await kvGet('default_api_keys')) || {};
  const userKeys = userId ? (await kvGet(`user_api_keys_${userId}`)) || {} : {};
  const merged = { ...defaults };
  for (const [k, v] of Object.entries(userKeys)) {
    if (v != null && String(v).trim().length > 0) merged[k] = v;
  }
  return merged;
};

const getConnectedFacebookPages = async (userId) => {
  return (await kvGet(`user_facebook_pages_${userId}`)) || [];
};

// ---------- Caption ----------
const captionInstructions = {
  HE: 'EXACTLY 150-200 characters (Highest Engagement — concise and punchy)',
  GNP: 'EXACTLY 300-350 characters (Good for Normal Posts — engaging and informative)',
  GIP: 'EXACTLY 450 characters or more (Good for Informative Posts — detailed and comprehensive)',
};

const generateCaption = async (keyword, captionSize, openaiKey) => {
  if (!openaiKey) throw new Error('No OpenAI API key configured');
  const charLimit = captionInstructions[captionSize] || captionInstructions.GNP;
  const maxTokens = captionSize === 'HE' ? 100 : captionSize === 'GIP' ? 300 : 200;

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are the social media voice of MOTOPSY — writing EXCLUSIVELY for the Indian market. ' +
            'HARD RULES on every post: ' +
            '(1) BRAND: include the word "Motopsy" in the body AND include the hashtag #Motopsy. ' +
            '(2) Currency: ALWAYS ₹ with Indian numbering (lakh, crore). NEVER $ / USD. ' +
            '(3) Indian context: Indian cities, brands (Maruti, Tata, Mahindra, Hyundai), festivals, language. ' +
            '(4) Add relevant topic hashtags too. ' +
            '(5) STRICTLY follow the character limit. Output only the post text.',
        },
        {
          role: 'user',
          content:
            `Create a compelling Indian-market social media post about: "${keyword}".\n\n` +
            `HARD REQUIREMENTS:\n- ${charLimit}\n- Include "Motopsy" in body + #Motopsy.\n` +
            `- Currency: ₹ only.\n- Indian context.\n- Engaging tone, relevant emojis.\n\nOutput ONLY the post text.`,
        },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI returned ${r.status}`);
  }
  const data = await r.json();
  let caption = data?.choices?.[0]?.message?.content?.trim();
  if (!caption) throw new Error('Empty caption from OpenAI');

  // Brand safety net (mirrors frontend ensureMotopsyBranding)
  if (!/#motopsy/i.test(caption)) caption = `${caption}\n\n#Motopsy`;
  const bodyOnly = caption.replace(/#\w+/g, '');
  if (!/motopsy/i.test(bodyOnly)) caption = `From Motopsy 👇\n${caption}`;

  return caption;
};

// ---------- Image (re-uses existing /api/generate-image logic) ----------
const generateImageInternal = async (port, keyword, caption, jwt) => {
  const r = await fetch(`http://127.0.0.1:${port}/api/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: JSON.stringify({ query: keyword, caption }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err?.error || `image gen returned ${r.status}`);
  }
  const data = await r.json();
  if (!data.success || !data.imageUrl) throw new Error('image gen failed');
  return data.imageUrl;
};

// ---------- FB publish (multipart bytes; no public URL needed) ----------
const localFilePathFromUrl = (urlStr) => {
  try {
    const u = new URL(urlStr);
    if (!u.pathname.startsWith('/uploads/')) return null;
    const filename = path.basename(u.pathname);
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) return null;
    return path.join(UPLOADS_DIR, filename);
  } catch {
    return null;
  }
};

// Mint a fresh page access token from /me/accounts using the supplied user
// token. Returns null on failure so the caller can retry / surface error.
const mintPageToken = async (userToken, pageId) => {
  if (!userToken) return null;
  try {
    const r = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,access_token&access_token=${encodeURIComponent(userToken)}`
    );
    const body = await r.json();
    if (!r.ok) return null;
    const match = (body?.data || []).find((p) => p.id === pageId);
    return match?.access_token || null;
  } catch (e) {
    console.warn('[pipeline] mintPageToken error:', e.message);
    return null;
  }
};

const publishToFacebookPage = async (page, caption, imageUrl, userToken, userId) => {
  const photoEndpoint = `https://graph.facebook.com/v18.0/${page.pageId}/photos`;

  // Always mint a fresh page token via /me/accounts (eliminates stale-token bugs)
  let pageAccessToken = (await mintPageToken(userToken, page.pageId)) || page.pageAccessToken;

  // If even the fresh-mint failed because the user token itself is expired,
  // try one silent extend and retry the mint. Most failures are caused by
  // a saved short-lived token that crossed its 1-hour TTL.
  let attemptedExtend = false;
  if (!pageAccessToken && userId) {
    attemptedExtend = true;
    try {
      const ext = await ensureLongLivedTokenForUser(userId);
      if (ext.exchanged) {
        // Re-read keys with the freshly-extended token
        const userKeys = (await kvGet(`user_api_keys_${userId}`)) || {};
        const newToken = userKeys.facebookAccessToken;
        pageAccessToken = (await mintPageToken(newToken, page.pageId)) || pageAccessToken;
        console.log('[pipeline] auto-extended FB token mid-publish for', userId);
      }
    } catch (e) {
      console.warn('[pipeline] auto-extend failed:', e.message);
    }
  }
  if (!pageAccessToken) {
    throw new Error(
      'Could not mint a Facebook Page access token. The saved user token is likely expired — paste a fresh one in Settings → API Keys → Save (the system will auto-extend it to 60 days).'
    );
  }

  // Read image bytes (local path preferred; remote URL otherwise)
  let buf = null;
  let contentType = 'image/png';
  const localPath = localFilePathFromUrl(imageUrl);
  if (localPath && fs.existsSync(localPath)) {
    buf = fs.readFileSync(localPath);
    contentType =
      imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
  } else if (imageUrl) {
    const r = await fetch(imageUrl);
    if (r.ok) {
      buf = Buffer.from(await r.arrayBuffer());
      contentType = r.headers.get('content-type') || 'image/png';
    }
  }
  if (!buf) throw new Error('No image bytes available');

  const callPhoto = async (token) => {
    const form = new FormData();
    form.append('source', new Blob([buf], { type: contentType }), 'post.png');
    form.append('caption', caption);
    form.append('access_token', token);
    const r = await fetch(photoEndpoint, { method: 'POST', body: form });
    return { ok: r.ok, status: r.status, result: await r.json() };
  };

  let { ok, result } = await callPhoto(pageAccessToken);

  // On 190 (token expired/invalid), do one silent extend + retry. Belt-and
  // -braces — the proactive mintPageToken usually catches this earlier.
  if (!ok && result?.error?.code === 190 && !attemptedExtend && userId) {
    try {
      const ext = await ensureLongLivedTokenForUser(userId);
      if (ext.exchanged) {
        const userKeys = (await kvGet(`user_api_keys_${userId}`)) || {};
        const fresh = await mintPageToken(userKeys.facebookAccessToken, page.pageId);
        if (fresh) {
          ({ ok, result } = await callPhoto(fresh));
        }
      }
    } catch (e) {
      console.warn('[pipeline] retry after 190 failed:', e.message);
    }
  }

  if (!ok || !result?.id) {
    throw new Error(result?.error?.message || `FB returned non-OK`);
  }
  return { postId: result.id, postUrl: `https://www.facebook.com/${result.id}` };
};

// ---------- Round-robin keyword picker ----------
export const pickNextKeyword = async (userId) => {
  const [keywords] = await pool.query(
    'SELECT id, keyword FROM keywords WHERE user_id = ? ORDER BY position ASC, created_at ASC',
    [userId]
  );
  if (keywords.length === 0) return null;

  const [cfgRows] = await pool.query(
    'SELECT last_keyword_index FROM auto_post_config WHERE user_id = ?',
    [userId]
  );
  const lastIdx = cfgRows[0]?.last_keyword_index ?? 0;
  const idx = ((lastIdx % keywords.length) + keywords.length) % keywords.length;
  const chosen = keywords[idx];
  // Increment for next pick
  await pool.query(
    `INSERT INTO auto_post_config (user_id, posting_times, last_keyword_index)
     VALUES (?, JSON_ARRAY('09:00','18:00'), ?)
     ON DUPLICATE KEY UPDATE last_keyword_index = VALUES(last_keyword_index)`,
    [userId, idx + 1]
  );
  return chosen;
};

// ---------- Top-level: process one scheduled post ----------
export const processScheduledPost = async (postRow, port = process.env.PORT || 4000) => {
  const userId = postRow.user_id;
  const keys = await getEffectiveKeys(userId);
  const fbPages = await getConnectedFacebookPages(userId);

  // 1. Caption
  const caption = await generateCaption(postRow.keyword, postRow.caption_size, keys.openai);

  // 2. Image (talks to our own /api/generate-image — keeps logic in one place)
  const imageUrl = await generateImageInternal(port, postRow.keyword, caption);

  // 3. Publish to every connected FB page
  const results = [];
  for (const page of fbPages) {
    try {
      const r = await publishToFacebookPage(
        page,
        caption,
        imageUrl,
        keys.facebookAccessToken,
        userId
      );
      results.push({ platform: 'facebook', pageId: page.pageId, success: true, ...r });
    } catch (err) {
      results.push({
        platform: 'facebook',
        pageId: page.pageId,
        success: false,
        error: err.message,
      });
    }
  }

  // (Instagram / LinkedIn / Twitter publishing left to a future iteration —
  // they each need separate API plumbing.)

  const allFailed = results.length > 0 && results.every((r) => !r.success);
  const status = results.length === 0 ? 'failed' : allFailed ? 'failed' : 'published';
  const errorMsg = allFailed
    ? results.map((r) => `${r.pageId}: ${r.error}`).join(' | ')
    : results.length === 0
      ? 'No connected Facebook pages.'
      : null;

  return {
    caption,
    imageUrl,
    publishResults: results,
    status,
    errorMsg,
  };
};

// Convenience: create a fresh `scheduled_posts` row, process it immediately,
// and update the row with the result. Used by /run-now and by the cron worker.
export const generateAndPublishNow = async (userId, captionSize = 'GNP', port) => {
  const kw = await pickNextKeyword(userId);
  if (!kw) throw new Error('No keywords configured for this user');

  const id = uuidv4();
  await pool.query(
    `INSERT INTO scheduled_posts
       (id, user_id, keyword, caption_size, scheduled_for, status, title)
     VALUES (?, ?, ?, ?, NOW(), 'processing', ?)`,
    [id, userId, kw.keyword, captionSize, kw.keyword]
  );

  try {
    const result = await processScheduledPost(
      { id, user_id: userId, keyword: kw.keyword, caption_size: captionSize },
      port
    );
    await pool.query(
      `UPDATE scheduled_posts
         SET caption=?, image_url=?, publish_results=?, status=?, error_msg=?,
             published_at=CASE WHEN ?='published' THEN NOW() ELSE NULL END
       WHERE id=?`,
      [
        result.caption,
        result.imageUrl,
        JSON.stringify(result.publishResults),
        result.status,
        result.errorMsg,
        result.status,
        id,
      ]
    );
    if (result.status === 'published') {
      await pool.query(
        'UPDATE keywords SET posts_created = posts_created + 1 WHERE id = ?',
        [kw.id]
      );
    }
    return { id, keyword: kw.keyword, ...result };
  } catch (err) {
    await pool.query(
      `UPDATE scheduled_posts SET status='failed', error_msg=? WHERE id=?`,
      [err.message, id]
    );
    throw err;
  }
};
