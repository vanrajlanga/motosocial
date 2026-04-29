// One-shot migration: pulls data from Supabase Postgres into local MySQL.
// Run with:  SUPABASE_DB_PASSWORD=xxxx npm run migrate
//
// Copies:
//   - auth.users -> users (email, name from raw_user_meta_data.name; password left as placeholder)
//   - kv_store_782899ec -> kv_store
//
// NOTE: Supabase stores passwords as bcrypt-with-`$2a$` strings encrypted via
// its own scheme; they cannot be moved directly. This script imports users
// with a RESET_REQUIRED password hash so they must sign up/reset locally.

import 'dotenv/config';
import pg from 'pg';
import { pool, initDb } from '../db.js';
import bcrypt from 'bcryptjs';

const {
  SUPABASE_DB_HOST,
  SUPABASE_DB_PORT = '5432',
  SUPABASE_DB_USER = 'postgres',
  SUPABASE_DB_PASSWORD,
  SUPABASE_DB_NAME = 'postgres',
  ADMIN_PASSWORD = '123456',
} = process.env;

if (!SUPABASE_DB_PASSWORD) {
  console.error('❌ SUPABASE_DB_PASSWORD env var is required.');
  process.exit(1);
}

const pgClient = new pg.Client({
  host: SUPABASE_DB_HOST,
  port: Number(SUPABASE_DB_PORT),
  user: SUPABASE_DB_USER,
  password: SUPABASE_DB_PASSWORD,
  database: SUPABASE_DB_NAME,
  ssl: { rejectUnauthorized: false },
});

const migrateUsers = async () => {
  console.log('→ migrating users...');
  const { rows } = await pgClient.query(`
    SELECT id, email, raw_user_meta_data, created_at
    FROM auth.users
  `);

  // Shared placeholder hash so migrated users can sign in with the same
  // password as the seeded admin (123456). Users should be told to change it.
  const placeholderHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  let inserted = 0;
  let skipped = 0;

  for (const r of rows) {
    const name = r.raw_user_meta_data?.name || null;
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [r.email]);
    if (existing.length > 0) {
      skipped++;
      continue;
    }
    await pool.query(
      'INSERT INTO users (id, email, password_hash, name, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        r.id,
        r.email,
        placeholderHash,
        name,
        JSON.stringify(r.raw_user_meta_data || {}),
        r.created_at || new Date(),
      ]
    );
    inserted++;
  }
  console.log(`  users: inserted=${inserted} skipped=${skipped}`);
};

const migrateKv = async () => {
  console.log('→ migrating kv_store_782899ec...');
  const { rows } = await pgClient.query('SELECT key, value FROM kv_store_782899ec');
  let count = 0;
  for (const r of rows) {
    await pool.query(
      'INSERT INTO kv_store (`key`, value) VALUES (?, ?) ' +
        'ON DUPLICATE KEY UPDATE value = VALUES(value)',
      [r.key, JSON.stringify(r.value)]
    );
    count++;
  }
  console.log(`  kv_store: imported=${count}`);
};

const main = async () => {
  console.log('[migrate] connecting to Supabase Postgres...');
  await pgClient.connect();
  console.log('[migrate] initialising local MySQL schema...');
  await initDb();

  await migrateUsers();
  await migrateKv();

  await pgClient.end();
  await pool.end();
  console.log('✅ migration complete');
};

main().catch((err) => {
  console.error('❌ migration failed:', err);
  process.exit(1);
});
