#!/bin/bash
# Usage: ./run-routine.sh <routine-name>
# e.g.   ./run-routine.sh finance-il-reconciliation

set -e

ROUTINE="$1"
if [ -z "$ROUTINE" ]; then
  echo "Usage: $0 <routine-name>"
  exit 1
fi

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SKILL_FILE="$REPO_DIR/skills/$ROUTINE/SKILL.md"

if [ ! -f "$SKILL_FILE" ]; then
  echo "ERROR: Skill file not found: $SKILL_FILE"
  exit 1
fi

# Pull latest code before running (keeps skills up to date)
cd "$REPO_DIR" && git pull --quiet origin main 2>/dev/null || true

SKILL_CONTENT=$(cat "$SKILL_FILE")
TODAY=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Get active brands from Supabase (passed as context to Claude)
BRANDS=$(node -e "
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('brands').select('id,name,slug,niche').eq('status','active').then(({data}) => {
  if(data) data.forEach(b => console.log('ID:'+b.id+' name:'+b.name+' slug:'+b.slug+' niche:'+b.niche));
});
" 2>/dev/null || echo "No brands yet")

PROMPT="Today: $TODAY

Active brands:
$BRANDS

=== SKILL: $ROUTINE ===
$SKILL_CONTENT
=== END SKILL ===

Execute this routine now for all active brands. Use the Supabase MCP for all database operations. Use per-brand API tokens from the connections table (SELECT account_ref FROM connections WHERE brand_id='...' AND platform='...'). When done, insert a row into agent_logs."

echo "[$(date)] Starting routine: $ROUTINE"

# Run Claude Code in non-interactive mode
claude --dangerously-skip-permissions -p "$PROMPT" 2>&1

echo "[$(date)] Finished routine: $ROUTINE"
