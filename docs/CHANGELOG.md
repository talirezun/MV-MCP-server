# 📋 MountVacation MCP Server — Changelog

All notable changes to this project are documented in this file.

---

## [2.1.0] — 2026-03-12

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
- **API batching** with complete pagination support (350% more results)
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

