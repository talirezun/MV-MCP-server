# MV Travel MCP Server — Changelog

Client script (v3.x) and Cloudflare Worker (v2.x) are versioned separately; entries below track the Worker.

All notable changes to this project are documented in this file.

---

## [Installer 1.0] — 2026-10-28

### ⚡ New: one-line install

- `curl -fsSL https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/install/install.sh | bash` (macOS/Linux) or `irm https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/install/install.ps1 | iex` (Windows).
- Asks for the API key (hidden input) and checks it with MV Travel before changing anything.
- Downloads the client script into `~/.mv-travel-mcp/`, pinned to release tag `client-v3.5.0` and verified by SHA-256.
- Detects installed AI apps and registers an `mv-travel` entry in each one the user picks:
  - through the app's own CLI for Claude Code, Codex CLI, Gemini CLI and VS Code;
  - by merging the JSON config for Claude Desktop, Cursor, Windsurf, Cline, Roo Code, LM Studio, Kiro, Antigravity, opencode and Zed.
- Backs up each file and keeps other servers.
- Config files it can't safely edit (comments, YAML) get a paste-ready snippet instead.
- Re-run to update; `--uninstall` removes it. `--dry-run`, `--yes`, `--clients` and `MV_TRAVEL_API_KEY` are supported for scripted setups.

---

## [2.2.0] — 2026-10-28

### 🐛 Fixed: Location Resolution, Cross-Border Safety and Error Reporting

Deployed to both Cloudflare Workers (identical code): `mv-travel-mcp` (https://mv-travel-mcp.talirezun.com) and the legacy alias `mountvacation-mcp-final` (https://mountvacation-mcp-final.4thtech.workers.dev). This is the first release that ships the 2.1.0 location fix to users, together with fixes for regressions an audit found in it.

- **Dynamic place lookup crash**: Searches that returned "not in our database" now work (e.g. Ischgl, Mayrhofen, Kitzbühel, Katschberg, Poreč, Terme Čatež). The cause was a crash in dynamic place lookup when the API returned per-language titles.
- **"Town, Country" inputs**: Inputs such as "Flachau, Austria" now resolve to the town instead of a country-wide default.
- **Cross-border safety**: Results from multi-country ski areas are filtered to the requested place (e.g. Sestriere never returns French Montgenèvre hotels).
- **Authentication errors**: A rejected API key now returns a clear authentication error instead of "not found".
- **No availability**: Destinations with no availability for the dates say so instead of "not in database".
- **Logging**: API keys are redacted from Worker logs.
- **Caching**: Only non-empty results are cached.
- **Search summary**: `search_summary.persons_count` is populated.

### 🔧 Deployment

- `npm run deploy` in `cloudflare-workers` deploys both Workers: `wrangler deploy && wrangler deploy --env legacy`.
- The legacy alias stays up permanently because client scripts up to v3.3.0 hardcode its hostname.
- The unused `blocklabs-mountvacation-mcp-production` Worker was deleted; `wrangler.toml` no longer defines production/staging/development environments.

### 📦 Client script 3.5.0

- Calls `mv-travel-mcp.talirezun.com` and reports serverInfo name `mv-travel-mcp-server`. Still connects via Cloudflare IP 188.114.96.3 with the Host header.
- File names, tool names and the `MOUNTVACATION_API_KEY` env var are unchanged.
- No action needed for existing users: older scripts call the legacy alias, which runs v2.2.0. Re-downloading is optional and only changes the server name/address.

### ⚠️ Known Limitation

- Some town names not in the built-in list can resolve to a nearby town in the same country (e.g. "Zagreb, Croatia" returns Zadar-area results).

---

## [2.1.0] — 2026-03-12

> **Note:** This release was committed but deployed only to the unused `blocklabs-mountvacation-mcp-production` Worker, so it did not reach users until 2.2.0.

### 🐛 Fixed: Location Resolution Cross-Border Bug

**Problem:** Searching for specific resorts (Sestriere, Obergurgl, Sölden) returned accommodations from the wrong country. For example, "Sestriere" (Italy) returned a French hotel in Montgenèvre because both belong to the same multi-country ski area (Via Lattea).

**Root Cause:** The search strategy prioritized SkiArea IDs over Resort IDs, and all API-returned results were trusted without validation — even when a SkiArea spans multiple countries.

**Fix (two algorithmic changes):**

1. **Strategy reordering**: Changed priority from `skiarea → resort → city → region` to `resort → city → skiarea → region`. The most specific entity (Resort) is now checked first.
2. **Validation trust narrowing**: Only Resort and City ID results are trusted without keyword validation. SkiArea and Region results are now validated against the user's search query to prevent cross-border mismatches.

**Impact:** These are general algorithmic changes, not per-location patches. They apply to all 150+ mapped locations and all dynamically resolved locations.

### ✅ Verified Results

| Location | Before | After |
|---|---|---|
| Sestriere | ❌ French hotel (Montgenèvre) | ✅ "No accommodations found" |
| Obergurgl | ❌ Wrong results | ✅ "No accommodations found" (seasonal) |
| Sölden | ❌ Wrong results | ✅ "No accommodations found" (seasonal) |
| Katschberg | ❌ Failed to resolve | ✅ 4 correct results |
| Terme Čatež | ❌ Failed to resolve | ✅ 5 correct results (Slovenia) |
| Ischgl | ✅ Working | ✅ No regression |
| Mayrhofen | ✅ Working | ✅ No regression |

### 📁 Files Changed
- `cloudflare-workers/src/api/mountvacation-client.ts` — Strategy reordering + validation trust logic
- `cloudflare-workers/src/types.ts` — Added debug fields to LogContext

---

## [2.0.0] — 2025-11-06

### 🚀 Major Release: Full European Coverage

- **150+ static location mappings** covering 8+ countries
- **10 MCP tools** including pagination, geolocation, and multi-region research
- **API batching** with complete pagination support
- **Family pricing** with age-based discounts
- **Direct booking links** with affiliate tracking
- **Croatia & Slovenia** full coverage added
- **Cloudflare Worker** architecture for global edge deployment
- **User-provided API keys** — no server-side credential storage

---

## [1.0.0] — 2025-09-28

### 🎉 Initial Release

- Basic MCP server with accommodation search
- Core European ski destinations (Austria, Italy, France, Switzerland)
- Claude Desktop and Augment Code compatibility
- JSON-RPC 2.0 protocol compliance

---

*For the full bug diagnosis that led to v2.1.0, see [MV-MCP-Location-Resolution-Bug-Report.md](./MV-MCP-Location-Resolution-Bug-Report.md).*

