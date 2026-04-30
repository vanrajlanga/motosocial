// Read + edit feed for the user's scheduled / published posts.
// Powers the Content Calendar page (review, edit, regenerate, delete).

import { Router } from 'express';
import { pool, kvGet } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { processScheduledPost } from '../services/contentPipeline.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const params = [req.user.sub];
    let where = 'user_id = ?';
    if (from) {
      where += ' AND scheduled_for >= ?';
      params.push(new Date(String(from)));
    }
    if (to) {
      where += ' AND scheduled_for <= ?';
      params.push(new Date(String(to)));
    }
    if (status && ['pending', 'processing', 'published', 'failed', 'cancelled'].includes(String(status))) {
      where += ' AND status = ?';
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT id, keyword, caption_size, title, caption, image_url, scheduled_for,
              status, publish_results, error_msg, published_at, created_at
       FROM scheduled_posts
       WHERE ${where}
       ORDER BY scheduled_for ASC
       LIMIT 500`,
      params
    );

    const posts = rows.map((r) => ({
      ...r,
      publish_results: r.publish_results
        ? typeof r.publish_results === 'string'
          ? JSON.parse(r.publish_results)
          : r.publish_results
        : null,
    }));
    res.json({ success: true, posts });
  } catch (err) {
    console.error('[scheduled-posts:list]', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM scheduled_posts
        WHERE id = ? AND user_id = ? AND status IN ('pending','failed','cancelled')`,
      [req.params.id, req.user.sub]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[scheduled-posts:delete]', err);
    res.status(500).json({ error: err.message });
  }
});

// Re-arm every failed post for the user so the cron worker picks them up
// again. Optionally takes { ids: [...] } to limit which failed rows get
// retried; without it, all failed rows for the user are retried.
//
// scheduled_for is also bumped to NOW for any row whose original slot has
// already passed, otherwise cron would still skip them on the next tick.
router.post('/retry-failed', requireAuth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(Boolean) : null;

    let where = `user_id = ? AND status = 'failed'`;
    const params = [req.user.sub];
    if (ids && ids.length > 0) {
      where += ` AND id IN (?)`;
      params.push(ids);
    }

    const [r] = await pool.query(
      `UPDATE scheduled_posts
          SET status = 'pending',
              error_msg = NULL,
              scheduled_for = CASE WHEN scheduled_for < NOW() THEN NOW() ELSE scheduled_for END
        WHERE ${where}`,
      params
    );

    res.json({ success: true, retried: r.affectedRows || 0 });
  } catch (err) {
    console.error('[scheduled-posts:retry-failed]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bulk delete — only removes pending/failed/cancelled rows owned by the user.
router.post('/bulk-delete', requireAuth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(Boolean) : [];
    if (ids.length === 0) return res.json({ success: true, deleted: 0 });
    const [r] = await pool.query(
      `DELETE FROM scheduled_posts
        WHERE user_id = ? AND id IN (?) AND status IN ('pending','failed','cancelled')`,
      [req.user.sub, ids]
    );
    res.json({ success: true, deleted: r.affectedRows || 0 });
  } catch (err) {
    console.error('[scheduled-posts:bulk-delete]', err);
    res.status(500).json({ error: err.message });
  }
});

// Edit a pending/failed post — caption, image_url, scheduled_for, keyword.
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT status FROM scheduled_posts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.sub]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (!['pending', 'failed', 'cancelled'].includes(rows[0].status)) {
      return res
        .status(400)
        .json({ error: `Cannot edit a ${rows[0].status} post.` });
    }

    const fields = [];
    const params = [];
    if (typeof req.body?.caption === 'string') {
      fields.push('caption = ?');
      params.push(req.body.caption);
    }
    if (typeof req.body?.image_url === 'string') {
      fields.push('image_url = ?');
      params.push(req.body.image_url);
    }
    if (req.body?.scheduled_for) {
      fields.push('scheduled_for = ?');
      params.push(new Date(req.body.scheduled_for));
    }
    if (typeof req.body?.keyword === 'string' && req.body.keyword.trim()) {
      fields.push('keyword = ?', 'title = ?');
      params.push(req.body.keyword.trim(), req.body.keyword.trim());
    }
    if (typeof req.body?.title === 'string') {
      fields.push('title = ?');
      params.push(req.body.title);
    }
    // Re-arm a previously-failed row so cron retries it.
    if (req.body?.requeue) {
      fields.push("status = 'pending'", 'error_msg = NULL');
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    params.push(req.params.id, req.user.sub);
    await pool.query(
      `UPDATE scheduled_posts SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );
    const [updated] = await pool.query(
      `SELECT id, keyword, caption_size, title, caption, image_url, scheduled_for,
              status, publish_results, error_msg, published_at, created_at
         FROM scheduled_posts WHERE id = ?`,
      [req.params.id]
    );
    res.json({ success: true, post: updated[0] });
  } catch (err) {
    console.error('[scheduled-posts:edit]', err);
    res.status(500).json({ error: err.message });
  }
});

// Pre-fill the caption + image for ONE pending post (or regenerate just one
// part by passing { only: 'caption' | 'image' }). Doesn't publish — just
// drafts the content so the user can review on the calendar.
router.post('/:id/prefill', requireAuth, async (req, res) => {
  try {
    const only = req.body?.only;
    const [rows] = await pool.query(
      'SELECT * FROM scheduled_posts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.sub]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const post = rows[0];
    if (!['pending', 'failed', 'cancelled'].includes(post.status)) {
      return res.status(400).json({ error: `Cannot prefill a ${post.status} post.` });
    }

    // Lazy-imports so we don't have circular issues
    const { generateCaptionForKeyword, generateImageForKeyword } = await getPipelineParts();

    let { caption, image_url } = post;
    const keys = await getEffectiveKeys(req.user.sub);

    if (!only || only === 'caption' || only === 'all') {
      caption = await generateCaptionForKeyword(post.keyword, post.caption_size, keys.openai);
    }
    if (!only || only === 'image' || only === 'all') {
      image_url = await generateImageForKeyword(
        post.keyword,
        caption || post.caption || '',
        process.env.PORT || 4000
      );
    }

    await pool.query(
      'UPDATE scheduled_posts SET caption = ?, image_url = ? WHERE id = ?',
      [caption, image_url, post.id]
    );
    res.json({ success: true, caption, image_url });
  } catch (err) {
    console.error('[scheduled-posts:prefill]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Convenience aliases — same handler as /prefill with `only` pinned.
const prefillSingle = async (req, res, only) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM scheduled_posts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.sub]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const post = rows[0];
    if (!['pending', 'failed', 'cancelled'].includes(post.status)) {
      return res.status(400).json({ error: `Cannot prefill a ${post.status} post.` });
    }
    const { generateCaptionForKeyword, generateImageForKeyword } = await getPipelineParts();
    const keys = await getEffectiveKeys(req.user.sub);
    let { caption, image_url } = post;
    if (only === 'caption' || only === 'all') {
      caption = await generateCaptionForKeyword(post.keyword, post.caption_size, keys.openai);
    }
    if (only === 'image' || only === 'all') {
      image_url = await generateImageForKeyword(
        post.keyword,
        caption || post.caption || '',
        process.env.PORT || 4000
      );
    }
    await pool.query(
      'UPDATE scheduled_posts SET caption = ?, image_url = ? WHERE id = ?',
      [caption, image_url, post.id]
    );
    res.json({ success: true, caption, image_url });
  } catch (err) {
    console.error('[scheduled-posts:prefill-alias]', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

router.post('/:id/regenerate-image', requireAuth, (req, res) => prefillSingle(req, res, 'image'));
router.post('/:id/regenerate-caption', requireAuth, (req, res) =>
  prefillSingle(req, res, 'caption')
);

// Helpers ---------------------------------------------------------------

const getEffectiveKeys = async (userId) => {
  const defaults = (await kvGet('default_api_keys')) || {};
  const userKeys = userId ? (await kvGet(`user_api_keys_${userId}`)) || {} : {};
  const merged = { ...defaults };
  for (const [k, v] of Object.entries(userKeys)) {
    if (v != null && String(v).trim().length > 0) merged[k] = v;
  }
  return merged;
};

// Re-export the pipeline's caption + image generators without publishing.
// Done as a function so the import is lazy and cycle-free.
const getPipelineParts = async () => {
  // Tiny re-implementations that talk to the same upstreams as the pipeline.
  const generateCaptionForKeyword = async (keyword, captionSize, openaiKey) => {
    if (!openaiKey) throw new Error('No OpenAI key');
    const charLimit =
      captionSize === 'HE'
        ? 'EXACTLY 150-200 characters'
        : captionSize === 'GIP'
          ? 'EXACTLY 450 characters or more'
          : 'EXACTLY 300-350 characters';
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are the social media voice of MOTOPSY for the INDIAN market. Hard rules: ' +
              '(1) Include "Motopsy" in body + #Motopsy hashtag. ' +
              '(2) Currency ₹ only — never $. ' +
              '(3) Indian context (cities, brands, festivals). ' +
              '(4) Strict character limit. Output only the post text.',
          },
          {
            role: 'user',
            content: `Create a compelling Indian-market post about: "${keyword}". ${charLimit}. Include "Motopsy" in body + #Motopsy.`,
          },
        ],
        temperature: 0.7,
        max_tokens: captionSize === 'GIP' ? 300 : captionSize === 'HE' ? 100 : 200,
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error?.message || `OpenAI ${r.status}`);
    let text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty caption');
    if (!/#motopsy/i.test(text)) text = `${text}\n\n#Motopsy`;
    if (!/motopsy/i.test(text.replace(/#\w+/g, ''))) text = `From Motopsy 👇\n${text}`;
    return text;
  };

  const generateImageForKeyword = async (keyword, caption, port) => {
    const r = await fetch(`http://127.0.0.1:${port}/api/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: keyword, caption }),
    });
    const data = await r.json();
    if (!r.ok || !data.success) throw new Error(data?.error || 'image gen failed');
    return data.imageUrl;
  };

  return { generateCaptionForKeyword, generateImageForKeyword };
};

export default router;
