import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import uploadRoutes from './routes/upload.js';
import generateRoutes from './routes/generate.js';
import exposeRoutes from './routes/expose.js';
import keywordsRoutes from './routes/keywords.js';
import autoPostRoutes from './routes/autoPost.js';
import scheduledPostsRoutes from './routes/scheduledPosts.js';
import socialRoutes from './routes/social.js';
import { startCronWorker } from './services/cronWorker.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.resolve('uploads'), { maxAge: '1y' }));

// Mount at the new clean prefix
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', uploadRoutes);
app.use('/api', generateRoutes);
app.use('/api', exposeRoutes);
app.use('/api/keywords', keywordsRoutes);
app.use('/api/auto-post', autoPostRoutes);
app.use('/api/scheduled-posts', scheduledPostsRoutes);
app.use('/api/social', socialRoutes);

// Back-compat: mirror the old Supabase Edge Function path shape so older
// frontend builds that still point to /functions/v1/make-server-782899ec/*
// keep working while we migrate the UI.
const LEGACY_PREFIX = '/functions/v1/make-server-782899ec';
app.use(`${LEGACY_PREFIX}/auth`, authRoutes);
app.post(`${LEGACY_PREFIX}/signup`, (req, res, next) => {
  req.url = '/signup';
  authRoutes.handle(req, res, next);
});
app.use(`${LEGACY_PREFIX}/user`, userRoutes);
app.use(LEGACY_PREFIX, uploadRoutes);
app.use(LEGACY_PREFIX, generateRoutes);
app.use(LEGACY_PREFIX, exposeRoutes);

app.get('/', (_req, res) => res.json({ name: 'motopsyai-backend', status: 'ok' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const start = async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`[server] listening on http://localhost:${PORT}`);
      startCronWorker();
    });
  } catch (err) {
    console.error('[fatal] failed to start:', err);
    process.exit(1);
  }
};

start();
