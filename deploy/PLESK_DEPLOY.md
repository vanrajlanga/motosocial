# Plesk Deployment Runbook — `motosocial`

Target host: `185.202.238.189` (`strange-mccarthy.185-202-238-189.plesk.page`)
Subscription path: `/var/www/vhosts/strange-mccarthy.185-202-238-189.plesk.page`
GitHub repo: `https://github.com/vanrajlanga/motosocial`

> **Security**: rotate the root password immediately after this deploy completes — it was shared in chat.

---

## Step 1 · One-time prerequisites on the VPS

Open PuTTY → connect to `185.202.238.189` as `root`. Paste:

```bash
# Node 20 (NodeSource) — only if 'node' is missing or older than 18
node -v 2>/dev/null || (
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
  apt-get install -y nodejs
)

# PM2 process manager (user-space install via npm — no system package)
command -v pm2 >/dev/null || npm install -g pm2

# Git is already on Plesk; just confirm
git --version
```

---

## Step 2 · MySQL database (use Plesk's bundled MySQL)

Either:

**Option A — via Plesk panel** (preferred): Domains → your domain → Databases → "Add Database":
- Database name: `motopsyai`
- User: `motopsyai`
- Password: any strong password — **save it, you'll paste it in `.env` next step**.

**Option B — via shell** (if you'd rather):

```bash
DB_PASS='REPLACE_ME_STRONG'      # set a real password
mysql -uadmin -p`cat /etc/psa/.psa.shadow` <<SQL
CREATE DATABASE IF NOT EXISTS motopsyai DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'motopsyai'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON motopsyai.* TO 'motopsyai'@'localhost';
FLUSH PRIVILEGES;
SQL
echo "DB password: ${DB_PASS}"
```

The backend auto-creates all tables (`users`, `kv_store`, `keywords`, `auto_post_config`, `scheduled_posts`, `uploaded_files`) on first boot — no schema import needed.

---

## Step 3 · Clone the repo into the subscription

```bash
DOMAIN=strange-mccarthy.185-202-238-189.plesk.page
cd /var/www/vhosts/${DOMAIN}
[ -d motosocial ] || git clone https://github.com/vanrajlanga/motosocial.git
cd motosocial
```

---

## Step 4 · Production env vars

Create `backend/.env` (NOT committed; gitignored):

```bash
cat > /var/www/vhosts/${DOMAIN}/motosocial/backend/.env <<'EOF'
PORT=4000

DB_HOST=localhost
DB_PORT=3306
DB_USER=motopsyai
DB_PASSWORD=REPLACE_WITH_THE_PASSWORD_YOU_SET_ABOVE
DB_NAME=motopsyai

JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_STRING
JWT_EXPIRES_IN=7d

ADMIN_EMAIL=admin@eclipso.com
ADMIN_PASSWORD=REPLACE_WITH_A_REAL_ADMIN_PASSWORD
ADMIN_NAME=Admin

# AI keys — paste the same ones you've been using locally
OPENAI_API_KEY=
GEMINI_API_KEY=

# 30% with-person, 70% object-only
HUMAN_IMAGE_RATIO=0.3

# So image URLs returned to the browser are public, not localhost
PUBLIC_BASE_URL=https://strange-mccarthy.185-202-238-189.plesk.page
EOF
chmod 600 /var/www/vhosts/${DOMAIN}/motosocial/backend/.env
```

Create the frontend's build-time API URL — the React app will call same-origin
`/api/...` once nginx is wired (Step 6), so `VITE_API_URL` should be empty
(falls back to the running origin):

```bash
cat > /var/www/vhosts/${DOMAIN}/motosocial/.env.production <<'EOF'
# Empty = same-origin. The app concatenates "/api" so requests go to
# https://<your-domain>/api/...  and nginx reverse-proxies to :4000.
VITE_API_URL=
EOF
```

---

## Step 5 · Run the deploy script

```bash
cd /var/www/vhosts/${DOMAIN}/motosocial
chmod +x deploy/deploy.sh
DOMAIN="${DOMAIN}" deploy/deploy.sh
```

This will:
- pull latest, install backend deps,
- build the frontend, copy `dist/` to `httpdocs/`,
- start (or restart) the backend via PM2.

When the script finishes, lock PM2's resurrection list so it survives reboots:

```bash
pm2 save
pm2 startup systemd -u root --hp /root      # then run the line it prints
```

---

## Step 6 · Wire nginx (Plesk panel)

Plesk → **Domains → strange-mccarthy.185-202-238-189.plesk.page → Apache & nginx Settings**
→ scroll to **"Additional nginx directives"** → paste the contents of
[`deploy/nginx-additional.conf`](./nginx-additional.conf) → **Apply**.

This adds three location blocks:
- `/api/*` → reverse-proxy to `127.0.0.1:4000`
- `/uploads/*` → reverse-proxy to the same backend (where AI-generated images live)
- `/` → SPA fallback so React Router handles client-side routes

Plesk reloads nginx automatically.

---

## Step 7 · Verify

```bash
# backend health
curl -s http://127.0.0.1:4000/api/health
# expect: {"status":"ok"}

# frontend served via nginx
curl -sI https://strange-mccarthy.185-202-238-189.plesk.page | head -1
# expect: HTTP/2 200

# api reachable through nginx
curl -s https://strange-mccarthy.185-202-238-189.plesk.page/api/health
# expect: {"status":"ok"}
```

Open the site in a browser:
**https://strange-mccarthy.185-202-238-189.plesk.page/**

Login: `admin@eclipso.com` / *(whatever you set in `.env`)*

If anything in PM2 is unhappy:

```bash
pm2 logs motopsyai-backend --lines 100
pm2 status
```

---

## Future deploys

Just push to the `main` branch of `motosocial` on GitHub, then on the VPS:

```bash
cd /var/www/vhosts/${DOMAIN}/motosocial && deploy/deploy.sh
```

`deploy/deploy.sh` is idempotent — pulls, installs, rebuilds, restarts PM2.
