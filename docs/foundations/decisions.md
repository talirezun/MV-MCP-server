# MV Travel MCP — Decision log

Newest first. Each entry: decision, date, why.

## 2026-10-28 — Keep `mountvacation-mcp-final` live permanently as a legacy alias
It runs the same code as `mv-travel-mcp`, and `npm run deploy` deploys both. **Why:** every client script up to v3.3.0 hardcodes that hostname (plus IP 188.114.96.3). Removing it would break existing installs, and keeping it costs nothing.

## 2026-10-28 — New installs use `mv-travel-mcp.talirezun.com`
The client script v3.5.0 points there. **Why:** branding with no blocklabs or 4thtech. mv-travel.com is not on this Cloudflare account; moving to an mv-travel.com host would need MV Travel's DNS. The account workers.dev subdomain `4thtech` is shared by other Workers and must not be changed.

## 2026-10-28 — Deleted `blocklabs-mountvacation-mcp-production`; removed the production/staging/dev envs
**Why:** it had 1 request in 30 days (our own check), and `wrangler deploy --env production` targeted it, which is how the March 2026 fix silently never reached users.

## 2026-10-28 — Worker v2.2.0 shipped after local regression + two independent audits
Order: local `wrangler dev` regression set → Opus and Fable audits → fixes → re-run → deploy → the same set against production. **Why:** production had failed 10 of 30 test searches and hijacked "Town, Country" inputs, while the undeployed March fix had its own regressions.

## 2026-10-28 — Versioning
The Worker (v2.x) and the client script (v3.x) are versioned separately. Releases are tagged `worker-vX.Y.Z` / `client-vX.Y.Z` with GitHub releases. **Why:** there were no tags, and versions in the docs had drifted from the code.

## 2026-10-28 — Rebrand prose to "MV Travel", keep `mountvacation` identifiers
User-facing text says MV Travel (https://mv-travel.com/). Tool names, the `MOUNTVACATION_API_KEY` env var, the `X-MountVacation-API-Key` header, script file names and `api.mountvacation.com` stay. The MCP config entry key in the examples is `mv-travel`; existing `mountvacation` entries keep working. **Why:** renaming identifiers breaks installed configs and download URLs.

## 2026-10-28 — Production workflow
Orchestrator + delegated subagents (Haiku → Sonnet → Opus; Fable for complex audits). Audit before every push to `main` and every Worker deploy, and get owner approval for both. **Why:** live MCP with real users; `main` is the download channel for client scripts.

## 2026-10-28 — Cross-border guard filters, not just checks
`validateLocationMatch` keeps only accommodations that match the requested place. Fuzzy dynamic resort/city matches (<0.9 confidence) and skiarea/region results are always validated. **Why:** checking "any one result matches" let Via Lattea return French hotels alongside an Italian one.

## 2026-03-12 — Search strategy resort → city → skiarea → region
**Why:** skiarea-first returned French hotels for Italian resorts (Sestriere → Montgenèvre). Regression set: Sestriere, Katschberg, Terme Čatež, Ischgl, Mayrhofen, Flachau, Via Lattea.

## 2026-02-25 — Static mappings use verified IDs, not coordinates
**Why:** coordinate search returned unreliable results, and the API now rejects it with 400.

## 2026-02-25 — Silent handling of JSON-RPC notifications (client v3.3.0)
**Why:** Claude Desktop compatibility.

## 2025-10-21 — Client scripts connect by Cloudflare IP with Host header
**Why:** local DNS overrides broke connections. Consequence: the hostname is hardcoded in every installed script.

## 2025 — User-provided API keys, no server-side credentials
**Why:** security and per-user billing with MV Travel.
