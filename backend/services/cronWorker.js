// Cron worker: every minute, claim due `pending` posts and run the pipeline.
// Single-process, single-machine — fine for the local dev/single-server case.
// To scale horizontally, add a Redis lock or move this to a queue.

import cron from 'node-cron';
import { pool } from '../db.js';
import { processScheduledPost } from './contentPipeline.js';

const tick = async () => {
  let claimed;
  try {
    // Claim a small batch atomically by flipping their status.
    // Without SKIP LOCKED, we just rely on the WHERE clause + immediate UPDATE
    // — good enough for one process.
    const [due] = await pool.query(
      `SELECT id, user_id, keyword, caption_size
       FROM scheduled_posts
       WHERE status = 'pending' AND scheduled_for <= NOW()
       ORDER BY scheduled_for ASC
       LIMIT 5`
    );
    if (due.length === 0) return;

    const ids = due.map((r) => r.id);
    const [r] = await pool.query(
      `UPDATE scheduled_posts SET status = 'processing'
       WHERE id IN (?) AND status = 'pending'`,
      [ids]
    );
    if (!r.affectedRows) return;
    claimed = due.slice(0, r.affectedRows);
  } catch (err) {
    console.error('[cron] claim error:', err);
    return;
  }

  for (const post of claimed) {
    console.log(`[cron] processing post ${post.id} keyword="${post.keyword}"`);
    try {
      const result = await processScheduledPost(post);
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
          post.id,
        ]
      );
      if (result.status === 'published') {
        await pool.query(
          `UPDATE keywords k
              JOIN scheduled_posts sp ON sp.keyword = k.keyword AND sp.user_id = k.user_id
              SET k.posts_created = k.posts_created + 1
            WHERE sp.id = ?`,
          [post.id]
        );
      }
      console.log(`[cron] post ${post.id} -> ${result.status}`);
    } catch (err) {
      console.error(`[cron] post ${post.id} failed:`, err.message);
      await pool.query(
        `UPDATE scheduled_posts SET status='failed', error_msg=? WHERE id=?`,
        [err.message?.slice(0, 1000) || 'unknown error', post.id]
      );
    }
  }
};

export const startCronWorker = () => {
  // Every minute on the minute. Cron expression: minute hour dayOfMonth month dayOfWeek
  cron.schedule('* * * * *', () => {
    tick().catch((e) => console.error('[cron] tick error:', e));
  });
  console.log('[cron] worker started — checks every minute');
};
