import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

const toUser = (row) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  user_metadata: row.metadata
    ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata)
    : { name: row.name },
});

// POST /auth/signup  { email, password, name }
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length > 0) {
      // Match old contract: "already exists" is a soft-success
      return res.json({ success: true, message: 'User already exists' });
    }

    const id = uuidv4();
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (id, email, password_hash, name, metadata) VALUES (?, ?, ?, ?, ?)',
      [id, email, hash, name || null, JSON.stringify({ name: name || null })]
    );

    res.json({
      success: true,
      user: { id, email, name },
    });
  } catch (err) {
    console.error('[signup]', err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// POST /auth/signin  { email, password }
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const row = rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid login credentials' });

    const user = toUser(row);
    const accessToken = signToken(user);

    res.json({
      success: true,
      session: {
        access_token: accessToken,
        refresh_token: accessToken, // single-token scheme; same value for compat
        token_type: 'bearer',
        expires_in: 7 * 24 * 60 * 60,
        user,
      },
      user,
    });
  } catch (err) {
    console.error('[signin]', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /auth/session  (Bearer token)
router.get('/session', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user.sub]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid session' });
    res.json({ success: true, user: toUser(rows[0]) });
  } catch (err) {
    console.error('[session]', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /auth/signout  (no-op; JWT is stateless — client just drops the token)
router.post('/signout', (_req, res) => res.json({ success: true }));

export default router;
