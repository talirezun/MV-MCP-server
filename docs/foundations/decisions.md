# MV Travel MCP — Decision log

Newest first. Each entry: decision, date, why.

## 2026-10-28 — Rebrand prose to "MV Travel", keep `mountvacation` identifiers
User-facing text (README, docs) says **MV Travel** and links https://mv-travel.com/. Tool names, the `MOUNTVACATION_API_KEY` env var, file names (`mountvacation-mcp-server.js`), the `X-MountVacation-API-Key` header, the `api.mountvacation.com` upstream and Worker names stay unchanged. **Why:** renaming any of these breaks every installed user config and download URL.

## 2026-10-28 — Production workflow
Orchestrator + delegated subagents (Haiku → Sonnet → Opus; Fable for complex audits). Audit before every push to `main` and every Worker deploy; owner approval required for both. **Why:** live MCP with real users; `main` is the download channel for client scripts.

## 2026-10-28 — Do not touch either Worker until the live one is confirmed
`mountvacation-mcp-final` is almost certainly live (all client scripts call it). `blocklabs-mountvacation-mcp-production` looks idle but README advertises it. **Why:** deleting or redeploying the wrong one could break users.

## 2026-03-12 — Search strategy resort → city → skiarea → region, with cross-border validation (Worker v2.1.0)
**Why:** skiarea-first returned French hotels for Italian resorts (Sestriere → Montgenèvre via Via Lattea). Regression set: Sestriere, Obergurgl, Sölden, Katschberg, Terme Čatež, Ischgl, Mayrhofen. See repo `docs/MV-MCP-Location-Resolution-Bug-Report.md`.

## 2026-02-25 — Static mappings use verified IDs, not coordinates (v3.4.0)
**Why:** coordinate/geolocation search returned unreliable results from the API.

## 2026-02-25 — Silent handling of JSON-RPC notifications (v3.3.0)
No response to messages without `id` (e.g. `notifications/initialized`). **Why:** Claude Desktop compatibility.

## 2025-10-21 — Client scripts connect by Cloudflare IP with Host header (v3.3)
**Why:** local DNS overrides/caching broke connections. Consequence: hostname and IP are hardcoded in every client script.

## 2025 — User-provided API keys, no server-side credentials
**Why:** security and per-user billing with MV Travel.
