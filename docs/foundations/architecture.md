# MV Travel MCP — Architecture

Updated 2026-10-28 (Worker v2.2.0, client script v3.5.0, installer 1.0). Fuller narrative: `docs/PROJECT-ARCHITECTURE.md` in the repo.

## Shape

```
MCP client (Claude Desktop, LM Studio, Augment, Cline…)
   │ stdio, JSON-RPC 2.0, protocol 2024-11-05
   ▼
server-versions/mountvacation-mcp-server.js   (runs on the USER's machine)
   │ HTTPS POST /mcp to Cloudflare IP 188.114.96.3 with the Worker hostname as Host/SNI
   │ header X-MountVacation-API-Key: <user's key>
   ▼
Cloudflare Worker (cloudflare-workers/, one codebase, two deployments)
   │ location resolution (static mappings → dynamic ID mapping → fallbacks) + validation
   ▼
MV Travel API  api.mountvacation.com  (apiKey query param)
```

## Two Workers, identical code

| Worker | URL | Who calls it |
|---|---|---|
| `mv-travel-mcp` | https://mv-travel-mcp.talirezun.com (custom domain on the talirezun.com zone) | client script v3.5.0+ |
| `mountvacation-mcp-final` | https://mountvacation-mcp-final.4thtech.workers.dev | client scripts ≤ v3.3.0, which hardcode this hostname. **Permanent legacy alias. Never delete.** |

- `wrangler.toml`: the top-level `name = "mv-travel-mcp"` with a custom_domain route; `[env.legacy]` holds `mountvacation-mcp-final` with `workers_dev = true` and its own copy of the vars (envs don't inherit `[vars]`).
- `npm run deploy` runs `wrangler deploy && wrangler deploy --env legacy`. Never deploy only one.
- `4thtech` is the account-wide workers.dev subdomain, shared with other Workers (agentlink, talirezun-com, cors). Don't change it.
- `blocklabs-mountvacation-mcp-production` was deleted 2026-10-28. The March 2026 fix had been deployed only to it, so it never reached users.

## Components

- **Client scripts** in `server-versions/`: `mountvacation-mcp-server.js` (standard), `-cline.js`, `-v2.js`. Plain Node with no dependencies, downloaded from `raw.githubusercontent.com/.../main/server-versions/`, so **`main` is the release channel**. The serverInfo name is `mv-travel-mcp-server` (v3.5.0).
- **One-line installer** in `install/`: `install.sh` (curl | bash), `install.ps1` (irm | iex) and `install.js` (Node, no deps).
  - Validates the key against the Worker (no redirects).
  - Downloads the client script pinned to `CLIENT_TAG` + `SHA256` (bump these on every client release).
  - Registers `mv-travel` through the app CLI (Claude Code, Codex, Gemini, VS Code on mac/linux) or a strict-JSON merge (Claude Desktop, Cursor, Windsurf/Devin, Cline, Roo, LM Studio, Kiro, Antigravity, opencode, Zed, VS Code on Windows), with backup, atomic 0600 write and symlink-safe handling.
  - Replaces an old `mountvacation` entry.
  - Sandboxed tests: `bash install/test/run-tests.sh`. Windows has not yet been run on a real machine.
- **Worker source**:
  - `src/index.ts`: HTTP and MCP handler, tool dispatch, the cache guard.
  - `src/api/mountvacation-client.ts`: API client, search strategies, validation, upstream-error accounting, key redaction.
  - `src/api/id-mapping.ts`: dynamic ID mapping against `/countries /regions /cities /resorts /skiareas`.
  - `src/utils/`: cache (no KV bound, so effectively off), logger, rate limiter.
- No automated Worker tests. The regression check is a scripted set of location searches run against a local `wrangler dev` before deploy, then against production after.

## Tools (10)

`search_accommodations`, `search_accommodations_complete`, `load_more_accommodations`, `get_accommodation_details`, `get_facility_details`, `search_by_resort_id`, `search_by_city_id`, `search_by_geolocation`, `get_booking_links`, `research_accommodations`.

## Location resolution (v2.2.0)

1. **Static mapping** (`findLocationMapping`):
   - exact match on the folded full input, then on the part before the comma;
   - a word-boundary partial match only for specific place keys (≥4 chars);
   - country or area keys ("austria", "alps", skiarea/region-only keys) match only exactly.
   - Strategies run resort → city → skiarea → region.
2. **Dynamic mapping** (`IdMappingManager`):
   - fuzzy match on API metadata; titles may be strings or per-language objects (`titleText`);
   - diacritic-folded;
   - the country hint from "Town, Country" demotes other countries.
3. **Fallbacks**: generic region/coordinate searches. The API rejects coordinate searches with 400, which counts as "rejected", not "failed".

**Trust:** resort/city ID results are trusted, but dynamic ones only at confidence ≥ 0.9. Everything else goes through `validateLocationMatch`, which filters the results down to accommodations whose city/resort/region/country text contains a requested keyword. That is the cross-border guard; the canonical case is Sestriere vs Montgenèvre in Via Lattea.

**Outcomes:**
- At least one successful API call with 0 results → a "no availability for these dates" `message`.
- Every call failed with 401/403 → an auth `error`.
- Every call failed otherwise → an upstream `error`.
- Nothing resolved → a "not in our database" `error`.

## Auth

The key is user-supplied only: `MOUNTVACATION_API_KEY` env var → `X-MountVacation-API-Key` header → `apiKey` param upstream. Nothing is stored server-side, and the key is redacted in logs.

## Known limitations

- Dynamic fuzzy matching can pick a nearby town in the same country, e.g. "Zagreb, Croatia" gives Zadar-area results and "Obertauern, Austria" gives Kaprun.
- `searchByDirectParams` (ID-based tools) still reports API failures as "no accommodations found".
- The cache key ignores resort_id/city_id; harmless while KV is unbound.
