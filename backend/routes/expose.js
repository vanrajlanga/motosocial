// POST /api/expose-public
// Takes a URL that lives on THIS backend (e.g. http://localhost:4000/uploads/x.png)
// and re-uploads the file to a public image host. Returns the public URL.
// Social platforms (Facebook, LinkedIn, ...) must fetch the image themselves
// and obviously can't hit localhost — this bridges the gap.
//
// Provider chain:
//   1. ImgBB    — only if a *real* user-supplied key is present (free public
//                  keys get revoked frequently, see the "Invalid API v1 key"
//                  failure mode that motivated this rewrite).
//   2. Catbox   — anonymous, no key required, very reliable.
//   3. Litterbox — Catbox's temporary tier (1h–72h), used as last resort.

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { Blob } from 'buffer';
import { optionalAuth } from '../middleware/auth.js';
import { kvGet } from '../db.js';

const router = Router();
const UPLOADS_DIR = path.resolve('uploads');

const extractLocalFilename = (urlStr) => {
  try {
    const u = new URL(urlStr);
    if (!u.pathname.startsWith('/uploads/')) return null;
    const filename = path.basename(u.pathname);
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) return null;
    return filename;
  } catch {
    return null;
  }
};

const inferContentType = (filename) => {
  const ext = path.extname(filename).slice(1).toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/png';
};

const uploadToImgBB = async (buf, apiKey) => {
  if (!apiKey || apiKey.length < 20) throw new Error('No real ImgBB key configured');
  const base64 = buf.toString('base64');
  const form = new URLSearchParams();
  form.set('image', base64);
  form.set('expiration', '15552000'); // 180 days
  const r = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const data = await r.json();
  if (!r.ok || !data?.data?.url) {
    throw new Error(data?.error?.message || `ImgBB upload failed (${r.status})`);
  }
  return data.data.url;
};

const uploadToCatbox = async (buf, filename, contentType) => {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', new Blob([buf], { type: contentType }), filename);
  const r = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: form,
  });
  const txt = (await r.text()).trim();
  if (!r.ok || !txt.startsWith('http')) {
    throw new Error(`Catbox upload failed: ${txt.slice(0, 200) || r.status}`);
  }
  return txt;
};

const uploadToLitterbox = async (buf, filename, contentType) => {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('time', '72h');
  form.append('fileToUpload', new Blob([buf], { type: contentType }), filename);
  const r = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
    method: 'POST',
    body: form,
  });
  const txt = (await r.text()).trim();
  if (!r.ok || !txt.startsWith('http')) {
    throw new Error(`Litterbox upload failed: ${txt.slice(0, 200) || r.status}`);
  }
  return txt;
};

router.post('/expose-public', optionalAuth, async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ success: false, error: 'url required' });

    const filename = extractLocalFilename(url);
    if (!filename) {
      return res.json({ success: true, publicUrl: url, provider: 'passthrough' });
    }
    const fullPath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: 'Local file not found' });
    }
    const buf = fs.readFileSync(fullPath);
    const contentType = inferContentType(filename);

    // Pull a user-supplied ImgBB key if any (system default is intentionally
    // empty — embedded "free" keys get revoked).
    const defaults = (await kvGet('default_api_keys')) || {};
    let userKeys = {};
    if (req.user?.sub) userKeys = (await kvGet(`user_api_keys_${req.user.sub}`)) || {};
    const imgbbKey =
      (userKeys.imgbbApiKey || '').trim() ||
      (defaults.imgbbApiKey || '').trim() ||
      (process.env.IMGBB_API_KEY || '').trim();

    const errors = [];

    if (imgbbKey) {
      try {
        const publicUrl = await uploadToImgBB(buf, imgbbKey);
        console.log(`[expose-public] ${filename} -> ${publicUrl} (imgbb)`);
        return res.json({ success: true, publicUrl, provider: 'imgbb' });
      } catch (e) {
        console.warn('[expose-public] imgbb failed:', e.message);
        errors.push(`imgbb: ${e.message}`);
      }
    }

    try {
      const publicUrl = await uploadToCatbox(buf, filename, contentType);
      console.log(`[expose-public] ${filename} -> ${publicUrl} (catbox)`);
      return res.json({ success: true, publicUrl, provider: 'catbox' });
    } catch (e) {
      console.warn('[expose-public] catbox failed:', e.message);
      errors.push(`catbox: ${e.message}`);
    }

    try {
      const publicUrl = await uploadToLitterbox(buf, filename, contentType);
      console.log(`[expose-public] ${filename} -> ${publicUrl} (litterbox)`);
      return res.json({ success: true, publicUrl, provider: 'litterbox' });
    } catch (e) {
      console.warn('[expose-public] litterbox failed:', e.message);
      errors.push(`litterbox: ${e.message}`);
    }

    return res.status(502).json({
      success: false,
      error: `All public hosts failed: ${errors.join(' | ')}`,
    });
  } catch (err) {
    console.error('[expose-public]', err);
    res.status(500).json({ success: false, error: err.message || 'expose failed' });
  }
});

export default router;
