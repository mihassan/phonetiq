# API KNOWLEDGE BASE

## OVERVIEW
`api/` is a Cloudflare Worker using Hono. It fronts D1, R2, Workers AI, signed-session auth, and cloud progress sync.

## STRUCTURE
```text
api/
├── src/index.ts           # Worker entry, CORS, rate limiting, route mounting
├── src/routes/            # Route groups by domain
├── src/lib/               # Session auth + Google OAuth helpers
├── src/db/                # Drizzle schema + seed SQL
├── scripts/               # Eval harnesses + wrangler-with-env.mjs
├── test/                  # Vitest tests + WAV fixtures (recognition-eval/)
├── drizzle/               # SQL migrations
├── wrangler.toml          # Bindings, vars, routes, rate limits
└── package.json           # Dev/deploy/db/eval scripts
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Middleware / route registration | `src/index.ts` | CORS allowlist + AI/general rate limit tiers |
| Pair/category reads | `src/routes/pairs.ts` | Query/filter behavior |
| Audio serving | `src/routes/audio.ts` | R2 `.m4a` fetch path |
| Speech recognition | `src/routes/recognize.ts` | Whisper call + transcript matching using frame sentence |
| OAuth login/logout | `src/routes/auth.ts` | Redirect flow and session creation |
| Current user | `src/routes/me.ts` | Session-backed user response |
| Cloud progress sync | `src/routes/progress.ts` | Import/update/merge logic |
| Session cookies | `src/lib/session.ts` | Signed cookie helpers |
| Session user lookup | `src/lib/auth.ts` | Route auth primitive |
| Google OAuth helpers | `src/lib/googleOAuth.ts` | Auth URL, token exchange, profile fetch |
| Persistent model | `src/db/schema.ts` | Drizzle table definitions |
| Seed data | `src/db/seed.sql` | Word-pair dataset |
| Infra bindings | `wrangler.toml` | D1, R2, AI, origins, custom domain |
| Baseline eval harness | `scripts/run-eval.ts` | Dialect-tagged corpus with expanded pilot contrast families, per-dialect + contrast-family summaries, strict guardrails, and full/summary JSON output (`schemaVersion`, `outputMode`, run metadata); supports `--json-out <path>` in JSON modes and refuses overwrite unless `--json-out-overwrite` is set; includes artifact aliases (`eval:json:artifact`, `eval:summary:json:artifact`); `npm run eval` / `eval:fast` / `eval:json` / `eval:summary:json` / `eval:guard` |
| Frame eval harness | `scripts/run-eval-experiment.ts` | Same expanded dialect-tagged corpus on `dev:frame`, including contrast-family summaries, strict guardrails, and full/summary JSON output (`schemaVersion`, `outputMode`, run metadata); supports `--json-out <path>` in JSON modes and refuses overwrite unless `--json-out-overwrite` is set; includes artifact aliases (`eval:frame:json:artifact`, `eval:frame:summary:json:artifact`); `npm run eval:frame` / `eval:frame:json` / `eval:frame:summary:json` / `eval:frame:guard` |

## CONVENTIONS
- `src/index.ts` is the only place routes are mounted; route files export `const *Routes = new Hono...`.
- Environment contract lives in `Env` type in `src/index.ts`; keep bindings consistent with `wrangler.toml`.
- Auth is signed-cookie session auth, not JWT.
- Progress sync routes operate on the same conceptual store shape as the frontend local store.
- Worker AI recognition is candidate-constrained: candidate words and dialect prompt both matter.
- D1 access is done with prepared statements and explicit bindings.

## ANTI-PATTERNS
- Do not weaken the two-tier rate limiting without understanding Whisper cost exposure.
- Do not remove dialect-aware prompting/matching from `recognize.ts`; it is part of recognition quality.
- Do not bypass signed cookie helpers for auth changes.
- Do not treat `wrangler.toml` values as frontend config; web uses `VITE_API_URL`, Worker uses bindings/vars.
- Do not edit `drizzle/` migrations casually when the schema/seed data are the real source of intent.

## NOTES
- `wrangler.toml` includes `WEB_ORIGIN` plus optional `CORS_ALLOWED_ORIGINS`; CORS behavior is allowlist-based.
- Current schema supports `all`, `uk_only`, and `us_only`, but seeded exclusive US coverage is limited.
- Google OAuth is live here even though older PRD text still calls auth “out of scope”; trust current code over stale product docs.
- `progress.ts` and `recognize.ts` are the operational hotspots when debugging backend behavior.
