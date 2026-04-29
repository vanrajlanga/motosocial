import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { pool, kvGet } from '../db.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

const UPLOADS_DIR = path.resolve('uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const publicUrlFor = (req, filename) => {
  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${filename}`;
};

// Strip emojis, hashtags, and social-media scaffolding so the image model
// focuses on the actual subject rather than decorative characters.
const stripNoise = (s = '') =>
  s
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/gu, '') // emojis
    .replace(/#[\w_]+/g, '') // hashtags
    .replace(/https?:\/\/\S+/g, '') // urls
    .replace(/\s+/g, ' ')
    .trim();

// Default: 30% of generations include a prominent human subject; 70% are
// object/scene-only ("content-first"). Override with HUMAN_IMAGE_RATIO in .env.
const HUMAN_RATIO = (() => {
  const v = parseFloat(process.env.HUMAN_IMAGE_RATIO || '');
  if (Number.isFinite(v) && v >= 0 && v <= 1) return v;
  return 0.3;
})();

// --- Deterministic 1-in-10 ratio scheduler ---------------------------------
// Pure Math.random() picks have visible streaks in small samples (e.g. the
// user getting 5 human shots in a row from a 30% setting). Instead we burn
// through a shuffled 10-slot window that contains EXACTLY round(ratio*10)
// "with_person" slots, reshuffling when the window is empty. This gives the
// user the ratio they set, not an expectation-of-ratio.
const WINDOW = 10;
const HUMAN_PER_WINDOW = Math.max(0, Math.min(WINDOW, Math.round(HUMAN_RATIO * WINDOW)));

let modeQueue = [];
let runningTotals = { with_person: 0, no_person: 0 };

const refillQueue = () => {
  const arr = [
    ...Array(HUMAN_PER_WINDOW).fill('with_person'),
    ...Array(WINDOW - HUMAN_PER_WINDOW).fill('no_person'),
  ];
  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  modeQueue = arr;
};

const pickMode = () => {
  if (modeQueue.length === 0) refillQueue();
  const mode = modeQueue.pop();
  runningTotals[mode] = (runningTotals[mode] || 0) + 1;
  return mode;
};

console.log(
  `[generate-image] ratio config: HUMAN_IMAGE_RATIO=${HUMAN_RATIO} → ${HUMAN_PER_WINDOW}/${WINDOW} with_person per window`
);

const buildFallbackPrompt = (query, caption, mode) => {
  const subject = stripNoise(query || '').slice(0, 120);
  const context = stripNoise(caption || '').slice(0, 240);
  const base = subject || context || 'social media post illustration';

  if (mode === 'with_person') {
    return (
      `Realistic editorial photograph set in INDIA, featuring ONE Indian person as the subject, literally depicting: ${base}. ` +
      (context && context !== base ? `Context: ${context}. ` : '') +
      'Indian setting (street, shop, office, home, market), Indian-market brands/products where applicable. ' +
      'Photorealistic face, sharp facial details, natural Indian skin tone, no distortion, shallow depth of field, ' +
      'natural daylight, documentary style, no text, no watermark, no logos.'
    );
  }

  // No-person mode: focus entirely on the topic/object/scene
  return (
    `Realistic editorial product/scene photograph set in INDIA depicting: ${base}. ` +
    (context && context !== base ? `Context: ${context}. ` : '') +
    'ABSOLUTELY NO PEOPLE, no faces, no hands, no body parts, no silhouettes in the frame. ' +
    'Focus purely on objects, product, environment, or scene relevant to the topic — Indian-market context ' +
    '(Indian signage context, Indian-street ambience, Indian-market brands). ' +
    'Natural lighting, shallow depth of field where appropriate, clean composition, documentary/product photography style, ' +
    'no text, no watermark, no logos.'
  );
};

const buildInstructionWithPerson = (cleanQuery, cleanCaption) =>
  [
    'You write image-generation prompts for a social-media tool that targets the INDIAN market exclusively.',
    'This prompt is for a WITH-PERSON image: ONE Indian human subject as the hero of the frame.',
    '',
    'HARD RULES (non-negotiable):',
    '1. INDIA-ONLY CONTEXT:',
    '   - Indian person (South Asian / Indian ethnicity, authentic Indian attire — kurta, saree, salwar, or modern Indian office/casual wear as the topic demands).',
    '   - Indian setting: Indian streets, shops, offices, homes, markets, dealerships.',
    '   - Indian-market brands/products when relevant (Maruti Suzuki, Tata, Mahindra, Hyundai, Bajaj, Royal Enfield) — NOT European supercars, American pickups, or luxury brands unless the topic demands them.',
    '',
    '2. PEOPLE COUNT & FACE QUALITY (critical):',
    '   - EXACTLY ONE clearly-visible face. If a second person is essential to the story, show them from behind, in silhouette, out of focus in the background, or cropped (hands/torso only) — NEVER a second front-facing face.',
    '   - Prefer framings that lower face-rendering risk: over-the-shoulder, profile, three-quarter view, hands-focused close-up, looking-down at the product.',
    '   - The one visible face MUST be described with: "photorealistic face, sharp facial details, natural Indian skin tone, symmetric features, natural expression, no distortion".',
    '',
    '3. SUBJECT FIDELITY: image must literally match the topic. If "used car buying tips": an Indian buyer inspecting a common Indian used hatchback — NOT a luxury or sports car. If cooking: Indian food/kitchens. If finance: Indian desk scene with ₹ notes.',
    '',
    '4. STYLE: realistic documentary / editorial photography. Natural daylight or warm indoor light. Shallow depth of field so the subject is tack-sharp and background is blurred. Avoid cinematic glamour, neon, hero shots, painterly look, stock-photo whiteness.',
    '',
    '5. NO on-image text, logos, watermarks, readable signage. No cartoon or illustration style.',
    '',
    '6. Output ONLY the final prompt as one paragraph, max 110 words. No preamble, no quotes, no labels.',
    '',
    `TOPIC: ${cleanQuery || '(none)'}`,
    `CAPTION: ${cleanCaption || '(none)'}`,
    '',
    'Image prompt (one clear Indian face, photorealistic):',
  ].join('\n');

const buildInstructionNoPerson = (cleanQuery, cleanCaption) =>
  [
    'You write image-generation prompts for a social-media tool that targets the INDIAN market exclusively.',
    'This prompt is for a NO-PERSON image: the frame must contain zero humans. Focus entirely on objects, products, scenes, or environments that represent the topic.',
    '',
    'HARD RULES (non-negotiable):',
    '1. ABSOLUTELY NO PEOPLE. No faces, no hands, no arms, no legs, no silhouettes, no shadows of people, no mannequins, no statues of people. The frame is entirely object / product / scene.',
    '',
    '2. INDIA-ONLY CONTEXT:',
    '   - Indian setting (Indian roads, Indian shops, Indian kitchens, Indian offices, Indian markets, Indian homes) or clearly India-relevant objects.',
    '   - Indian-market brands/products where the topic calls for them (Maruti Suzuki, Tata, Mahindra, Hyundai hatchbacks; Indian food, rupee notes/coins, Indian street signage context, Indian packaging styles) — NOT American pickups, European supercars, western grocery aisles.',
    '',
    '3. SUBJECT FIDELITY: image must literally depict the topic in object/scene form.',
    '   - "used car buying tips" → close-up of a used Indian hatchback (engine bay, dashboard, odometer, tyre, key in ignition) or a used car lot with empty cars — no humans.',
    '   - "home loan EMI calculator" → a desk-top still life: calculator, bank passbook, ₹ notes, house-key, laptop showing a chart — no hands.',
    '   - "street food recipes" → a plate/tawa/kadhai of Indian street food, or an empty street-food cart — no vendors visible.',
    '   - "fitness tips" → gym equipment, yoga mat + water bottle + runners on a wooden floor — no people.',
    '',
    '4. STYLE: realistic editorial product photography or documentary still life. Clean composition, natural lighting or soft directional light, shallow depth of field, rich texture detail, photorealistic.',
    '',
    '5. NO on-image text, logos, watermarks, readable brand names or readable signage. No cartoon / illustration style.',
    '',
    '6. Output ONLY the final prompt as one paragraph, max 100 words. No preamble, no quotes, no labels.',
    '',
    `TOPIC: ${cleanQuery || '(none)'}`,
    `CAPTION: ${cleanCaption || '(none)'}`,
    '',
    'Image prompt (objects/scene only, absolutely no people, India-set):',
  ].join('\n');

const enhanceWithGemini = async (query, caption, mode) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const fallback = buildFallbackPrompt(query, caption, mode);
  if (!geminiKey) return fallback;

  const cleanCaption = stripNoise(caption).slice(0, 600);
  const cleanQuery = stripNoise(query).slice(0, 200);

  const instruction =
    mode === 'with_person'
      ? buildInstructionWithPerson(cleanQuery, cleanCaption)
      : buildInstructionNoPerson(cleanQuery, cleanCaption);

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: instruction }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 512,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );
    if (!r.ok) return fallback;
    const data = await r.json();
    const out = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!out) return fallback;
    // Reinforce negatives per mode so downstream image models respect them
    const negatives =
      mode === 'no_person'
        ? ' No people, no human, no face, no hands, no body parts, no silhouettes. No text, no watermark, no logos, no captions.'
        : ' No text, no watermark, no logos, no captions.';
    return `${out}${negatives}`;
  } catch {
    return fallback;
  }
};

const downloadImage = async (url) => {
  const r = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    },
  });
  if (!r.ok) throw new Error(`image fetch failed: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 1000) throw new Error('image too small');
  return buf;
};

// --- Imagen 4 via the Gemini API (primary image generator) ---
// Imagen exposes a `personGeneration` knob ("ALLOW_ADULT" | "DONT_ALLOW")
// that we drive from our 70/30 mode picker — a hard model-side guarantee
// that no people appear in `no_person` mode. Photorealism is excellent.
const generateWithImagen = async (prompt, geminiKey, mode) => {
  if (!geminiKey) return null;
  try {
    const personGeneration = mode === 'no_person' ? 'DONT_ALLOW' : 'ALLOW_ADULT';
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            personGeneration,
          },
        }),
      }
    );
    if (!r.ok) {
      const errText = await r.text();
      console.warn('[imagen-4] HTTP', r.status, errText.slice(0, 300));
      return null;
    }
    const data = await r.json();
    const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) {
      console.warn('[imagen-4] no bytesBase64Encoded in response');
      return null;
    }
    const buf = Buffer.from(b64, 'base64');
    if (buf.length < 5000) return null;
    console.log('[imagen-4] ok, bytes=', buf.length, 'personGeneration=', personGeneration);
    return buf;
  } catch (err) {
    console.warn('[imagen-4] error', err.message);
    return null;
  }
};

// --- Gemini 2.5 Flash Image (a.k.a. nano banana) fallback ---
// Conversational image gen. Doesn't have a hard person-disable flag, so we
// rely on the prompt's negatives, but it's reliable + free-tier friendly.
const generateWithGeminiFlashImage = async (prompt, geminiKey) => {
  if (!geminiKey) return null;
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
      }
    );
    if (!r.ok) {
      const errText = await r.text();
      console.warn('[gemini-flash-image] HTTP', r.status, errText.slice(0, 300));
      return null;
    }
    const data = await r.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const inline = parts.find((p) => p.inlineData?.data);
    if (!inline) {
      console.warn('[gemini-flash-image] no inlineData in response');
      return null;
    }
    const buf = Buffer.from(inline.inlineData.data, 'base64');
    if (buf.length < 5000) return null;
    console.log('[gemini-flash-image] ok, bytes=', buf.length);
    return buf;
  } catch (err) {
    console.warn('[gemini-flash-image] error', err.message);
    return null;
  }
};

// --- Pollinations (Flux) fallback ---
const generateWithPollinations = async (prompt) => {
  const encoded = encodeURIComponent(prompt);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&enhance=false&seed=${Date.now()}&model=flux`;
      const buf = await downloadImage(url);
      console.log('[pollinations] ok on attempt', attempt);
      return buf;
    } catch (e) {
      console.warn('[pollinations] attempt', attempt, e.message);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return null;
};

// Pulls the effective Gemini key: prefers user's override, falls back to
// the system default stored in kv_store, then to env. Used for Imagen 4
// and Gemini 2.5 Flash Image (and prompt enhancement, see top of file).
const getGeminiKey = async (userId) => {
  const defaults = (await kvGet('default_api_keys')) || {};
  let userKeys = {};
  if (userId) userKeys = (await kvGet(`user_api_keys_${userId}`)) || {};
  const fromUser = (userKeys.gemini || '').trim();
  const fromDefault = (defaults.gemini || '').trim();
  return fromUser || fromDefault || process.env.GEMINI_API_KEY || '';
};

// POST /generate-image  { caption, query?, mode? }
//   mode: 'with_person' | 'no_person' | 'auto' (default). 'auto' rolls the
//   70/30 dice (configurable via HUMAN_IMAGE_RATIO).
router.post('/generate-image', optionalAuth, async (req, res) => {
  try {
    const { caption, query, mode: clientMode } = req.body || {};
    if (!caption && !query) {
      return res.status(400).json({ success: false, error: 'caption or query required' });
    }

    const mode =
      clientMode === 'with_person' || clientMode === 'no_person' ? clientMode : pickMode();

    const enhancedPrompt = await enhanceWithGemini(query, caption, mode);
    console.log('[generate-image] topic:', query);
    console.log(
      `[generate-image] mode  : ${mode}  (window ${HUMAN_PER_WINDOW}/${WINDOW} • running totals: with_person=${runningTotals.with_person} no_person=${runningTotals.no_person})`
    );
    console.log('[generate-image] prompt:', enhancedPrompt.slice(0, 240));

    let buf = null;
    let provider = null;

    const geminiKey = await getGeminiKey(req.user?.sub);

    // 1) Primary: Imagen 4 (Google's photoreal model; honours personGeneration
    //    so no_person mode is a model-side guarantee, not just a prompt hope)
    if (geminiKey) {
      buf = await generateWithImagen(enhancedPrompt, geminiKey, mode);
      if (buf) provider = 'imagen-4';
    }

    // 2) Fallback A: Gemini 2.5 Flash Image (nano banana) — same key, free tier
    if (!buf && geminiKey) {
      buf = await generateWithGeminiFlashImage(enhancedPrompt, geminiKey);
      if (buf) provider = 'gemini-2.5-flash-image';
    }

    // 3) Fallback B: Pollinations Flux (free, used if Gemini is down)
    if (!buf) {
      buf = await generateWithPollinations(enhancedPrompt);
      if (buf) provider = 'pollinations-flux';
    }

    // 4) Last resort: Picsum placeholder (keeps the UI from breaking)
    if (!buf) {
      try {
        buf = await downloadImage(`https://picsum.photos/1024/1024?random=${Date.now()}`);
        if (buf) provider = 'picsum-placeholder';
      } catch (_) {
        /* handled below */
      }
    }

    if (!buf) {
      return res.status(500).json({ success: false, error: 'All image services failed' });
    }

    const filename = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), buf);
    const imageUrl = publicUrlFor(req, filename);

    await pool.query(
      'INSERT INTO uploaded_files (id, user_id, filename, mime_type, size_bytes, public_url) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), req.user?.sub || null, filename, 'image/png', buf.length, imageUrl]
    );

    console.log(`[generate-image] served via ${provider}, mode=${mode}, size=${buf.length}`);
    res.json({ success: true, imageUrl, enhancedPrompt, provider, mode });
  } catch (err) {
    console.error('[generate-image]', err);
    res.status(500).json({ success: false, error: err.message || 'Generation failed' });
  }
});

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

export default router;
