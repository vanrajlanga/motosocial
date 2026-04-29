#!/usr/bin/env bash
# Plesk deploy / re-deploy script for motosocial.
# Run on the VPS as root (or as the subscription's system user).
# Idempotent — safe to re-run after every `git pull`.

set -euo pipefail

DOMAIN="${DOMAIN:-strange-mccarthy.185-202-238-189.plesk.page}"
ROOT="/var/www/vhosts/${DOMAIN}"
APP="${ROOT}/motosocial"          # cloned repo
WEB="${ROOT}/httpdocs"            # nginx document root (Plesk default)
DB_NAME="${DB_NAME:-motopsyai}"
NODE_VERSION="${NODE_VERSION:-20}"

# ─────────────────────────────────────────────
# Sanity checks
# ─────────────────────────────────────────────
[ -d "${ROOT}" ] || { echo "❌ subscription path missing: ${ROOT}"; exit 1; }
[ -d "${APP}/.git" ] || { echo "❌ repo not cloned at ${APP}. Clone it first:"; \
    echo "    cd ${ROOT} && git clone https://github.com/vanrajlanga/motosocial.git"; \
    exit 1; }

# ─────────────────────────────────────────────
# Pull latest code
# ─────────────────────────────────────────────
cd "${APP}"
git fetch --all
git reset --hard origin/main

# ─────────────────────────────────────────────
# Backend deps + folders
# ─────────────────────────────────────────────
cd "${APP}/backend"
npm ci --omit=dev || npm install --omit=dev
mkdir -p uploads logs

# ─────────────────────────────────────────────
# Frontend build → copy to httpdocs
# ─────────────────────────────────────────────
cd "${APP}"
npm ci || npm install
npm run build
mkdir -p "${WEB}"
# Wipe and replace web root contents (preserves the dir itself, which Plesk owns)
find "${WEB}" -mindepth 1 -delete
cp -r dist/. "${WEB}/"

# ─────────────────────────────────────────────
# (Re)start backend via PM2
# ─────────────────────────────────────────────
cd "${APP}"
if pm2 describe motopsyai-backend > /dev/null 2>&1; then
    pm2 restart motopsyai-backend --update-env
else
    pm2 start ecosystem.config.cjs
fi
pm2 save

echo "✅ deploy complete."
echo "   Frontend → ${WEB}"
echo "   Backend  → pm2 process 'motopsyai-backend' on :4000"
echo "   Logs     → ${APP}/logs/  AND  pm2 logs motopsyai-backend"
