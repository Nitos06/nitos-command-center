---
name: hook-mining
description: Mines TikTok + Instagram videos for hook patterns. Scrapes 5000+ videos in a target niche via Playwright, downloads, runs Whisper on the first 3s, vision-tags 6 keyframes (this Claude session reads frames inline), computes viral_score (views/followers weighted by saves+shares), labels top decile as winners, then runs feature-lift analysis to surface which visual / audio / movement traits actually correlate with virality. Output: a ranked pattern report ("red dominant color → 2.3× lift", "outdoor + handheld → 1.8× lift") with example clips. Never scrapes Meta Ad Library — Meta hides performance signals.
trigger:
  manual: "/hooks mine {niche}"
  scheduled: "weekly Sun 03:00 Asia/Jerusalem"
mcp_dependencies:
  required:
    - supabase    # hooks + hook_patterns tables
    - playwright  # TikTok + IG scraping (no native MCPs exist)
  optional:
    - openai      # Whisper transcription (API)
references:
  - references/feature-taxonomy.md
self_heal: skills/_lib/self-heal.md
---

# Hook Mining Agent

Find what actually makes a video work. Three dimensions, every grain.

## Why this exists

Manually watching 5000 videos to spot patterns is impossible. Meta Ad Library hides views, so it's useless for performance learning. TikTok + IG show views/likes/comments publicly → we can compute a viral_score and learn from real winners.

## Pipeline (per run)

### Phase 1 — Scrape (Playwright MCP)

For each `niche` in scope:
- **TikTok**: search hashtag + sound + creator pages → collect 2500 video URLs with stats (views, likes, comments, shares, saves where visible, posted_at, account handle, account followers)
- **Instagram Reels**: search hashtag + explore → collect 2500 URLs with same stats
- Dedupe by `source_url`. Insert into `hooks` with `status='scraped'`.

Rate-limit: 1 request / 2s per platform. Rotate user agents. Headless Chromium.

### Phase 2 — Download (Playwright + yt-dlp fallback)

For each `status='scraped'` row:
- Download mp4 to Supabase Storage `hooks-raw/{id}.mp4`
- Extract first thumbnail to `hooks-thumbs/{id}.jpg`
- Set `status='downloaded'`, fill `duration_sec`, `aspect_ratio`

### Phase 3 — Audio (Whisper)

- Cut first 3s of audio (ffmpeg)
- Transcribe with Whisper (`whisper-1` API, ~$0.006/min → 5000 × 3s ≈ $1.50)
- Extract: `first_word`, `first_sentence`, voice presence, voice pace (wpm)
- Detect music: silence-detect → if non-voice signal present, flag `music_present=true`
- Tag genre/energy via a small classifier or this Claude session inspecting the audio waveform image
- Write `audio_features` jsonb. Set `status='transcribed'`

### Phase 4 — Vision (Claude session, 6 keyframes)

- Extract 6 frames: t=0.0, 0.5, 1.0, 1.5, 2.5, hook_end
- This Claude session reads the 6 frames per video and returns the full `visual_features` schema (see `references/feature-taxonomy.md`) — no separate vision MCP needed
- Same pass returns `movement_features` (camera motion, cuts/sec inferred from frame diff, subject motion)
- Set `status='vision_tagged'`

### Phase 5 — Score

```sql
update hooks set
  viral_score = (views::numeric / nullif(account_followers, 0))
                * (1 + 2 * coalesce(saves,0)::numeric / nullif(views,0)
                     + 1 * coalesce(shares,0)::numeric / nullif(views,0))
where status = 'vision_tagged';

-- Winners = top decile within (source, niche) cohort
update hooks h set is_winner = true
from (
  select id, percent_rank() over (partition by source, niche order by viral_score) as pr
  from hooks
) r
where h.id = r.id and r.pr >= 0.9;
```

Set `status='scored'`.

### Phase 6 — Embed (semantic search)

- Build a text blob per hook: `first_sentence + visual_features.aesthetic + dominant_color + props + camera_motion`
- Embed with OpenAI `text-embedding-3-small` (1536 dim) → ~$0.10 total
- Write `embedding`. Set `status='embedded'`

### Phase 7 — Pattern lift (the answer)

For each `(source, niche)` cohort, for each feature path in the taxonomy:

```
baseline_rate = winners / total
for each value V of feature F:
  winner_rate(V) = winners_with_F=V / total_with_F=V
  lift = winner_rate / baseline_rate
  if sample_size(F=V) >= 30: insert into hook_patterns
```

Then: `select * from v_top_hook_patterns where cohort_niche = $niche order by lift desc`.

Run XGBoost on the same data for feature-importance ranking (handles interactions like "red + female voice + outdoor"). Top 20 features written to `hook_patterns` with `feature_path='_xgb_combined'`.

## Output

- `hooks` table populated with 5000 rows fully tagged
- `hook_patterns` table populated with cohort × feature × lift
- Markdown digest:

```
🎣 Hook Mining — {niche} ({date})
Sample: {n} videos · Winners (top 10%): {w}

Top patterns by lift:
1. visual.dominant_color = red       → 2.3× lift (n=412)
2. visual.indoor_outdoor = outdoor   → 1.8× lift (n=890)
3. audio.hook_delivery = question    → 1.7× lift (n=1203)
4. movement.cuts_in_first_3s ≥ 4     → 1.6× lift (n=987)
5. visual.aesthetic = ugc_handheld   → 1.5× lift (n=2104)

Top semantic clusters: {3 example clips per cluster}
```

## Cost + time per run (5000 videos)

- Whisper: ~$1.50
- Vision tagging (this Claude session): inline (no separate API)
- Embeddings: ~$0.10
- Storage: ~50 GB videos at $0.021/GB/mo = $1.05/mo (delete after pattern extraction)
- **Total compute: ~$10**, **wall time: 3-5 hours** (Playwright scraping is the bottleneck)

## Self-heal

- Playwright blocked by platform → exponential backoff, swap UA, then halt + alert
- Whisper API quota → checkpoint at `status`, resume next run
- Video unavailable (403/404) → mark row `status='failed'`, `notes=<reason>`, skip

See `skills/_lib/self-heal.md`.

## Open items

- TikTok login wall on some content — solve with Playwright session cookie or scope to public-only
- Instagram aggressive bot detection — may need residential proxy; budget $30/mo for Bright Data if free scraping rate-limits hard
- Account_followers not always exposed inline → secondary scrape per profile (cache 30d)


---

## Logging Protocol

See `skills/_lib/logging-protocol.md` for the full SQL snippets.

**Required at every run:**
1. INSERT into `agent_runs` on start → save the returned `id` as `$RUN_ID`
2. INSERT into `agent_logs` for every major action/decision/result as it happens
3. UPDATE `agent_runs` on completion with `status`, `headline`, `cost_usd`, `tokens_used`, `kpis`

Use the Supabase MCP `execute_sql` tool for all inserts. Log in plain English as if reporting to the owner.
