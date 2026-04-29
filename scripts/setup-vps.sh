#!/bin/bash
# =============================================================
# Nitos Command Center — VPS Setup Script
# Run this ONCE on a fresh Hostinger Ubuntu 22.04 VPS
# Usage: bash setup-vps.sh
# =============================================================

set -e
echo "=== Nitos VPS Setup ==="

# ── 1. System packages ────────────────────────────────────────
echo "[1/7] Installing system packages..."
apt-get update -qq
apt-get install -y -qq curl git unzip nodejs npm 2>/dev/null

# Install Node.js 20 (required for Claude Code)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v && npm -v

# ── 2. Clone the repo ─────────────────────────────────────────
echo "[2/7] Cloning repo..."
cd /home
if [ ! -d "nitos" ]; then
  git clone https://github.com/Nitos06/nitos-command-center.git nitos
else
  echo "Repo already exists, pulling latest..."
  cd nitos && git pull origin main && cd ..
fi
cd /home/nitos
npm install --quiet

# ── 3. Install Claude Code CLI ────────────────────────────────
echo "[3/7] Installing Claude Code CLI..."
npm install -g @anthropic-ai/claude-code
claude --version

# ── 4. Environment variables ──────────────────────────────────
echo "[4/7] Setting up environment variables..."
cat > /home/nitos/.env << 'ENVEOF'
# ─── Fill these in ───────────────────────────────────────────
SUPABASE_URL=https://wjqmjcgixscrethrthin.supabase.co
SUPABASE_SERVICE_ROLE_KEY=REPLACE_ME
AWS_SES_ACCESS_KEY_ID=REPLACE_ME
AWS_SES_SECRET_ACCESS_KEY=REPLACE_ME
AWS_SES_REGION=eu-west-1
GEMINI_API_KEY=REPLACE_ME
TELEGRAM_BOT_TOKEN=REPLACE_ME
SHOPIFY_WEBHOOK_SECRET=REPLACE_ME
# ─────────────────────────────────────────────────────────────
ENVEOF
echo ">>> EDIT /home/nitos/.env and fill in the values before continuing"

# ── 5. GitHub auto-pull ───────────────────────────────────────
echo "[5/7] Setting up GitHub auto-pull..."
cat > /usr/local/bin/git-pull-nitos << 'PULLEOF'
#!/bin/bash
cd /home/nitos && git pull origin main --quiet 2>&1 | logger -t nitos-git-pull
PULLEOF
chmod +x /usr/local/bin/git-pull-nitos

# ── 6. Run-routine wrapper ────────────────────────────────────
echo "[6/7] Installing run-routine script..."
cp /home/nitos/scripts/run-routine.sh /usr/local/bin/run-routine
chmod +x /usr/local/bin/run-routine

# ── 7. Crontab ───────────────────────────────────────────────
echo "[7/7] Installing crontab..."
cat > /etc/cron.d/nitos-routines << 'CRONEOF'
# Nitos Agent Routines — all times in Israel local (UTC+3)
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
MAILTO=""

# ── Auto-pull latest code every 10 minutes ───────────────────
*/10 * * * * root /usr/local/bin/git-pull-nitos

# ── Finance ───────────────────────────────────────────────────
0 4 * * *     root source /home/nitos/.env && run-routine finance-il-reconciliation    >> /var/log/nitos/finance-reconciliation.log 2>&1
0 8 * * *     root source /home/nitos/.env && run-routine finance-il-profit-watch      >> /var/log/nitos/finance-profit.log 2>&1
0 6 1 * *     root source /home/nitos/.env && run-routine finance-il-monthly           >> /var/log/nitos/finance-monthly.log 2>&1
*/15 * * * *  root source /home/nitos/.env && run-routine finance-il-telegram-poll     >> /var/log/nitos/finance-telegram.log 2>&1

# ── Reviews ───────────────────────────────────────────────────
0 6 * * *     root source /home/nitos/.env && run-routine reviews-daily                >> /var/log/nitos/reviews.log 2>&1

# ── SEO ───────────────────────────────────────────────────────
0 2 */5 * *   root source /home/nitos/.env && run-routine seo-audit-autofix            >> /var/log/nitos/seo-audit.log 2>&1
0 6 * * 1,3,5 root source /home/nitos/.env && run-routine seo-blog-post                >> /var/log/nitos/seo-blog.log 2>&1

# ── Email ─────────────────────────────────────────────────────
0 7 * * 1     root source /home/nitos/.env && run-routine email-weekly-campaign        >> /var/log/nitos/email-campaign.log 2>&1
0 0 1 * *     root source /home/nitos/.env && run-routine email-monthly-topic-bank     >> /var/log/nitos/email-topics.log 2>&1
0 3 * * *     root source /home/nitos/.env && run-routine email-deliverability-nightly >> /var/log/nitos/email-delivery.log 2>&1

# ── Ads ───────────────────────────────────────────────────────
0 9 * * *     root source /home/nitos/.env && run-routine meta-ads-daily               >> /var/log/nitos/meta-ads.log 2>&1
0 9 * * *     root source /home/nitos/.env && run-routine ads-multi-platform-daily     >> /var/log/nitos/ads-multi.log 2>&1
0 4 * * 0     root source /home/nitos/.env && run-routine ads-competitor-weekly        >> /var/log/nitos/ads-competitor.log 2>&1
0 11 * * *    root source /home/nitos/.env && run-routine hook-mining-daily            >> /var/log/nitos/hook-mining.log 2>&1

# ── Analytics & Advisory ─────────────────────────────────────
0 7 * * *     root source /home/nitos/.env && run-routine analytics-daily              >> /var/log/nitos/analytics.log 2>&1
0 8 * * 0     root source /home/nitos/.env && run-routine advisory-weekly              >> /var/log/nitos/advisory.log 2>&1

# ── Instagram ─────────────────────────────────────────────────
0 7 * * 1     root source /home/nitos/.env && run-routine social-instagram-weekly-calendar >> /var/log/nitos/ig-calendar.log 2>&1
0 9 * * *     root source /home/nitos/.env && run-routine social-instagram-daily       >> /var/log/nitos/ig-daily.log 2>&1

# ── Other socials ─────────────────────────────────────────────
0 10 * * *    root source /home/nitos/.env && run-routine social-tiktok-daily          >> /var/log/nitos/tiktok.log 2>&1
0 11 * * 2    root source /home/nitos/.env && run-routine social-youtube-weekly        >> /var/log/nitos/youtube.log 2>&1
0 12 * * *    root source /home/nitos/.env && run-routine social-pinterest-daily       >> /var/log/nitos/pinterest.log 2>&1
0 11 * * *    root source /home/nitos/.env && run-routine social-facebook-post         >> /var/log/nitos/fb-post.log 2>&1
0 17 * * *    root source /home/nitos/.env && run-routine social-facebook-replies      >> /var/log/nitos/fb-replies.log 2>&1

# ── Customer Service & DMs ────────────────────────────────────
*/30 9-22 * * * root source /home/nitos/.env && run-routine customer-service-poll     >> /var/log/nitos/cs.log 2>&1
0 1 * * *     root source /home/nitos/.env && run-routine dm-funnel-nightly            >> /var/log/nitos/dm-funnel.log 2>&1

# ── Dashboard bridge ──────────────────────────────────────────
*/5 * * * *   root source /home/nitos/.env && run-routine dashboard-bridge             >> /var/log/nitos/bridge.log 2>&1
CRONEOF

# Create log directory
mkdir -p /var/log/nitos
chmod 777 /var/log/nitos

# Reload cron
service cron reload

echo ""
echo "=== Setup complete ==="
echo ""
echo "NEXT STEPS:"
echo "  1. Edit /home/nitos/.env  — fill in all API keys"
echo "  2. Run: claude auth login — authenticate with your claude.ai account"
echo "  3. Configure MCPs: claude mcp add supabase ..."
echo "  4. Test a routine: run-routine analytics-daily"
echo "  5. Watch logs: tail -f /var/log/nitos/analytics.log"
echo ""
echo "Repo: /home/nitos"
echo "Logs: /var/log/nitos/"
echo "Crons: /etc/cron.d/nitos-routines"
