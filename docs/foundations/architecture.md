# MV Travel MCP — Architecture

Established 2026-10-28 from the repository at commit 77d29f8. Fuller narrative: `docs/PROJECT-ARCHITECTURE.md` in the repo (written before the MV Travel rebrand).

## Shape

```
MCP client (Claude Desktop, LM Studio, Augment, Cline…)
   │ stdio, JSON-RPC 2.0, protocol 2024-11-05
   ▼
server-versions/mountvacation-mcp-server.js   (runs on the USER's machine, v3.3.0)
   │ HTTPS POST /mcp to 188.114.96.3, Host: mountvacation-mcp-final.4thtech.workers.dev
   │ header X-MountVacation-API-Key: <user's key>
   ▼
Cloudflare Worker  cloudflare-workers/src/index.ts   (v2.1.0)
   │ location resolution (id-mapping.ts, 150+ static mappings) + search strategy
   ▼
MV Travel API  api.mountvacation.com  (apiKey query param)
```

## Components

- **Client scripts** — `server-versions/`: `mountvacation-mcp-server.js` (standard), `-cline.js` (Cline variant), `-v2.js` (older v3.2 variant, still points at the same Worker). Plain Node, no dependencies. Users download them from `raw.githubusercontent.com/talirezun/MV-MCP-server/main/server-versions/...`, so **`main` is the release channel**. They hardcode the Worker hostname and a Cloudflare anycast IP (DNS-bypass fix from v3.3).
- **Worker** — `cloudflare-workers/`: `src/index.ts` (HTTP + MCP handler, CORS, tool dispatch), `src/api/mountvacation-client.ts` (API client, search strategies, cross-border validation, pagination), `src/api/id-mapping.ts` (static + dynamic location mapping), `src/utils/{cache,logger,rate-limiter}.ts`. TypeScript, `wrangler` 3.x, `@modelcontextprotocol/sdk` ^0.4. No test files exist in the repo despite a `jest` script.
- **Configs** — `mcp-configs/*.json`: sample client configs.

## Tools (10)

`search_accommodations`, `search_accommodations_complete`, `load_more_accommodations`, `get_accommodation_details`, `get_facility_details`, `search_by_resort_id`, `search_by_city_id`, `search_by_geolocation`, `get_booking_links`, `research_accommodations`.

## Search strategy (Worker v2.1.0)

resort → city → skiarea → region → dynamic fuzzy match. Resort/city results are trusted; skiarea/region results are keyword-validated against the query because those IDs can span countries (Via Lattea: Italy + France). High-confidence static mappings exit early with "no results" rather than falling back to a broader, wrong search.

## Deployment

`wrangler.toml` defines:
- top-level `name = "mountvacation-mcp-final"` — target of a bare `npm run deploy`. **This is the hostname every client script calls.**
- `[env.production] name = "blocklabs-mountvacation-mcp-production"` — `wrangler deploy --env production`. README calls this "Current Production URL", but no client script points at it; it appeared idle on the dashboard (2026-10-28).
- `[env.staging]`, `[env.development]` — named but not observed deployed.

Unverified as of 2026-10-28: whether any user hits `blocklabs-…-production` directly. Check Cloudflare analytics for both Workers before changing either.

## Auth

User-supplied key only: `MOUNTVACATION_API_KEY` env var in the client config → `X-MountVacation-API-Key` header → `apiKey` param upstream. Nothing stored server-side.
