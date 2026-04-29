import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'motopsyai',
  ADMIN_EMAIL = 'admin@eclipso.com',
  ADMIN_PASSWORD = '123456',
  ADMIN_NAME = 'Admin',
} = process.env;

// Step 1: connect without a database, create DB if missing
const bootstrapDb = async () => {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci`
  );
  await conn.end();
};

// Step 2: pool against the created DB
export const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS kv_store (
    \`key\` VARCHAR(255) NOT NULL PRIMARY KEY,
    value JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS uploaded_files (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NULL,
    filename VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    public_url VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // Keywords the user wants the auto-publisher to cycle through.
  // `position` defines the round-robin order; smaller = used sooner.
  `CREATE TABLE IF NOT EXISTS keywords (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    keyword VARCHAR(500) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    posts_created INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_pos (user_id, position),
    UNIQUE KEY uniq_user_keyword (user_id, keyword)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // One row per user. `posting_times` is JSON array like ["09:00","18:00"].
  // `last_keyword_index` advances after each scheduled post; modulo the
  // keyword list length, giving a clean round-robin reset.
  `CREATE TABLE IF NOT EXISTS auto_post_config (
    user_id CHAR(36) NOT NULL PRIMARY KEY,
    enabled TINYINT(1) NOT NULL DEFAULT 0,
    posts_per_day INT NOT NULL DEFAULT 2,
    posting_times JSON NOT NULL,
    caption_size VARCHAR(8) NOT NULL DEFAULT 'GNP',
    last_keyword_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // Each row is a planned (or completed) auto-post. Cron picks up rows
  // with status='pending' whose scheduled_for has passed.
  `CREATE TABLE IF NOT EXISTS scheduled_posts (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    keyword VARCHAR(500) NOT NULL,
    caption_size VARCHAR(8) NOT NULL DEFAULT 'GNP',
    title VARCHAR(500) NULL,
    caption TEXT NULL,
    image_url VARCHAR(1000) NULL,
    scheduled_for DATETIME NOT NULL,
    status ENUM('pending','processing','published','failed','cancelled') NOT NULL DEFAULT 'pending',
    platforms JSON NULL,
    publish_results JSON NULL,
    error_msg TEXT NULL,
    published_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_due (user_id, status, scheduled_for),
    INDEX idx_due (status, scheduled_for)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
];

export const initDb = async () => {
  await bootstrapDb();
  for (const stmt of SCHEMA) {
    await pool.query(stmt);
  }
  await seedAdmin();
  await seedDefaultApiKeys();
  console.log(`[db] ready at ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
};

const seedAdmin = async () => {
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [ADMIN_EMAIL]);
  if (rows.length > 0) return;
  const id = uuidv4();
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await pool.query(
    'INSERT INTO users (id, email, password_hash, name, metadata) VALUES (?, ?, ?, ?, ?)',
    [id, ADMIN_EMAIL, hash, ADMIN_NAME, JSON.stringify({ name: ADMIN_NAME, role: 'admin' })]
  );
  console.log(`[db] seeded admin user ${ADMIN_EMAIL}`);
};

const seedDefaultApiKeys = async () => {
  // Always refresh defaults from env so new keys added to .env propagate on restart.
  // User-specific keys in `user_api_keys_<id>` still override these on read.
  const defaults = {
    openai: process.env.OPENAI_API_KEY || '',
    gemini: process.env.GEMINI_API_KEY || '',
    elevenlabs: '',
    dalle: '',
    stabilityai: '',
    googleCloud: '',
    imgurClientId: '',
    imgbbApiKey: '',
    facebookAccessToken: '',
    instagramAccessToken: '',
    linkedinAccessToken: '',
    youtubeAccessToken: '',
    twitterAccessToken: '',
    dropboxAccessToken: '',
  };
  await pool.query(
    'INSERT INTO kv_store (`key`, value) VALUES (?, ?) ' +
      'ON DUPLICATE KEY UPDATE value = VALUES(value)',
    ['default_api_keys', JSON.stringify(defaults)]
  );
  console.log(
    `[db] seeded default_api_keys (openai=${defaults.openai ? 'set' : 'empty'}, gemini=${defaults.gemini ? 'set' : 'empty'})`
  );
};

// --- KV helpers (mirror the Supabase kv_store API) ---

export const kvGet = async (key) => {
  const [rows] = await pool.query('SELECT value FROM kv_store WHERE `key` = ? LIMIT 1', [key]);
  if (rows.length === 0) return null;
  const v = rows[0].value;
  // mysql2 returns JSON columns already parsed; guard if string
  return typeof v === 'string' ? JSON.parse(v) : v;
};

export const kvSet = async (key, value) => {
  await pool.query(
    'INSERT INTO kv_store (`key`, value) VALUES (?, ?) ' +
      'ON DUPLICATE KEY UPDATE value = VALUES(value)',
    [key, JSON.stringify(value)]
  );
};

export const kvDel = async (key) => {
  await pool.query('DELETE FROM kv_store WHERE `key` = ?', [key]);
};
