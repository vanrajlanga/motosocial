// CRUD for the keyword pool that the auto-publisher cycles through.

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, keyword, position, posts_created, created_at FROM keywords WHERE user_id = ? ORDER BY position ASC, created_at ASC',
      [req.user.sub]
    );
    res.json({ success: true, keywords: rows });
  } catch (err) {
    console.error('[keywords:list]', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { keyword } = req.body || {};
    if (!keyword || !keyword.trim()) {
      return res.status(400).json({ success: false, error: 'keyword required' });
    }
    const id = uuidv4();
    const [{ insertId }] = await pool.query(
      'SELECT COALESCE(MAX(position),0)+1 AS next_pos FROM keywords WHERE user_id = ?',
      [req.user.sub]
    ).then(([rows]) => [{ insertId: rows[0].next_pos }]);
    await pool.query(
      'INSERT INTO keywords (id, user_id, keyword, position) VALUES (?, ?, ?, ?)',
      [id, req.user.sub, keyword.trim(), insertId]
    );
    const [rows] = await pool.query(
      'SELECT id, keyword, position, posts_created, created_at FROM keywords WHERE id = ?',
      [id]
    );
    res.json({ success: true, keyword: rows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'Keyword already exists' });
    }
    console.error('[keywords:add]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM keywords WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.sub,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error('[keywords:delete]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
