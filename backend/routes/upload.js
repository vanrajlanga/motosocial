import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

const UPLOADS_DIR = path.resolve('uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const publicUrlFor = (req, filename) => {
  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${filename}`;
};

// POST /upload-image  (multipart form, field: "image")
router.post('/upload-image', optionalAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }
    const id = uuidv4();
    const url = publicUrlFor(req, req.file.filename);

    await pool.query(
      'INSERT INTO uploaded_files (id, user_id, filename, mime_type, size_bytes, public_url) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.user?.sub || null, req.file.filename, req.file.mimetype, req.file.size, url]
    );

    res.json({ success: true, url });
  } catch (err) {
    console.error('[upload]', err);
    res.status(500).json({ success: false, error: err.message || 'Upload failed' });
  }
});

export default router;
