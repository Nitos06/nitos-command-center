#!/bin/bash
# Usage: run-routine <routine-name>
# e.g.   run-routine analytics-daily

set -e

ROUTINE="$1"
if [ -z "$ROUTINE" ]; then
  echo "Usage: $0 <routine-name>"
  exit 1
fi

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ── Map routine name → skill directory ───────────────────────────
case "$ROUTINE" in
  finance-il-*)          SKILL_DIR="finance-il" ;;
  seo-*)                 SKILL_DIR="seo" ;;
  email-*)               SKILL_DIR="email-marketing" ;;
  meta-ads-*)            SKILL_DIR="meta-ads" ;;
  ads-multi-platform-*)  SKILL_DIR="ads-multi-platform" ;;
  ads-competitor-*)      SKILL_DIR="ads-competitor" ;;
  hook-mining-*)         SKILL_DIR="hook-mining" ;;
  analytics-*)           SKILL_DIR="analytics" ;;
  advisory-*)            SKILL_DIR="advisory" ;;
  reviews-*)             SKILL_DIR="reviews" ;;
  social-instagram-*)    SKILL_DIR="social-instagram" ;;
  social-tiktok-*)       SKILL_DIR="social-tiktok" ;;
  social-youtube-*)      SKILL_DIR="social-youtube" ;;
  social-pinterest-*)    SKILL_DIR="social-pinterest" ;;
  social-facebook-*)     SKILL_DIR="social-facebook" ;;
  customer-service-*)    SKILL_DIR="customer-service" ;;
  dm-funnel-*)           SKILL_DIR="dm-funnel" ;;
  dashboard-bridge)      SKILL_DIR="dashboard-bridge" ;;
  *)                     SKILL_DIR="$ROUTINE" ;;
esac

SKILL_FILE="$REPO_DIR/skills/$SKILL_DIR/SKILL.md"

if [ ! -f "$SKILL_FILE" ]; then
  echo "ERROR: Skill file not found: $SKILL_FILE"
  exit 1
fi

# Pull latest code before running
cd "$REPO_DIR" && git pull --quiet origin main 2>/dev/null || true

TODAY=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ── Load skill content ────────────────────────────────────────────
SKILL_CONTENT=$(cat "$SKILL_FILE")

# ── Load reference files ──────────────────────────────────────────
REF_CONTENT=""
REF_DIR="$REPO_DIR/skills/$SKILL_DIR/references"
if [ -d "$REF_DIR" ]; then
  for ref in "$REF_DIR"/*.md; do
    [ -f "$ref" ] || continue
    REF_CONTENT="${REF_CONTENT}

=== REFERENCE: $(basename "$ref") ===
$(cat "$ref")"
  done
fi

# ── Load shared _lib files (logging protocol, chain contract, self-heal) ──
LIB_CONTENT=""
LIB_DIR="$REPO_DIR/skills/_lib"
if [ -d "$LIB_DIR" ]; then
  for lib in "$LIB_DIR"/*.md; do
    [ -f "$lib" ] || continue
    LIB_CONTENT="${LIB_CONTENT}

=== LIB: $(basename "$lib") ===
$(cat "$lib")"
  done
fi

# ── Get active brands from Supabase ──────────────────────────────
BRANDS=$(node -e "
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('brands').select('id,name,slug,niche,base_currency').eq('status','active').then(({data,error}) => {
  if (error) { console.error(error.message); process.exit(1); }
  if (data) data.forEach(b => console.log('ID:'+b.id+' name:'+b.name+' slug:'+b.slug+' niche:'+b.niche+' currency:'+b.base_currency));
});
" 2>/dev/null || echo "No active brands yet")

# ── Build prompt ──────────────────────────────────────────────────
PROMPT="Today: $TODAY
Routine: $ROUTINE

Active brands:
$BRANDS

=== SKILL: $SKILL_DIR ===
$SKILL_CONTENT
=== END SKILL ===$REF_CONTENT
$LIB_CONTENT

Execute this routine now for all active brands. Follow the skill instructions exactly.

Rules:
- Use the Supabase MCP for ALL database reads and writes
- Get per-brand API tokens: SELECT account_ref FROM connections WHERE brand_id='...' AND platform='...'
- Get per-brand settings: SELECT * FROM brand_settings WHERE brand_id='...'
- Write state files to state/$SKILL_DIR/ as the skill specifies
- Log every major action to agent_logs via Supabase MCP
- Follow the logging protocol from _lib/logging-protocol.md: INSERT agent_runs on start, INSERT agent_logs for each action, UPDATE agent_runs on finish
- On finish, upsert routine_runs: INSERT INTO routine_runs (routine_name, started_at, finished_at, status) VALUES ('$ROUTINE', '$TODAY', now(), 'success') ON CONFLICT DO NOTHING"

echo "[$(date)] Starting: $ROUTINE (skill dir: $SKILL_DIR)"

# Run Claude Code non-interactively with all MCPs available
claude --dangerously-skip-permissions -p "$PROMPT" 2>&1

echo "[$(date)] Done: $ROUTINE"
