# MV Travel MCP Server

MCP server giving AI assistants access to the MV Travel (formerly MountVacation) accommodation API.
**It is in production with real users** — treat every change as a production change.

## Working state

This repository's working state lives in The Curator (project `projects/mv-travel-mcp`, see
`.curator-project`). At the START of every session call the my-curator MCP tool
`get_project_context` with project "mv-travel-mcp" and read the standing brief and latest
handoff before acting. When the user says continue or resume, or you come back after a
pause, call `get_project_context` again before acting — another tool or computer may have
saved since. SAVE with `save_working_state` under project "mv-travel-mcp" with the
`scope` argument set to your tool's name — "claude-code" if you are Claude Code,
"antigravity" if you are Antigravity, "opencode" if you are opencode, otherwise your
tool's own name, lowercase and hyphenated. Pass `scope` explicitly every time, and never
save under another tool's scope. Save after every material
decision, at least every ten tool calls, and ALWAYS before you stop; a save overwrites,
so send the complete state each time. Pass `harness` as that same name and `model` as
your exact model id if you know it (omit it otherwise — never search files for it), and
record the `seen` map as `foundations_read`.

This project also keeps foundations — canonical documents such as its architecture and firm
decisions — that travel with it. `get_project_context` is the call that returns them with
the brief and handoff, so make it your first action of the session, before you read code
or run anything. Its `seen` map holds their hashes: passing that back as `foundations_read`
on every save is how the next session learns which of them changed.

Some foundations may be skeletons — prompts, not facts; the document says so
at the top. As you learn the project, fill each one and save it with
`save_foundation` (`commissioned_by_owner: true` — this block is the owner's
commission). If the project has a repository, export the filled
foundations into its `docs/` folder on the first commit.

Foundations marked "read first" arrive with their text; the rest arrive as an index.
Open any of them by name with `get_project_context` and `slugs` when the work calls
for it — the brief's "Read before you…" section says which. An index entry with no
text is a document waiting to be asked for, not one that is missing.

## Production rules (summary — the Curator brief is authoritative)

- Orchestrate: do simple tasks directly; delegate real work to Haiku → Sonnet → Opus; complex audits may go to Fable.
- Always audit before pushing anything to production.
- Never `git push` to `main` or deploy a Worker without the owner's explicit approval in the current session.
- Production = two Workers with identical code: `mv-travel-mcp` (mv-travel-mcp.talirezun.com) and the legacy alias `mountvacation-mcp-final`, which old client scripts hardcode and which must never be removed.
- Deploy only with `npm run deploy` (in `cloudflare-workers/`), which deploys both Workers.
- Run a regression search set locally with `wrangler dev` before any deploy.
- Roll back per Worker with `npx wrangler rollback <version-id> --name <worker>`.
- Two production surfaces: the Cloudflare Workers (`cloudflare-workers/`) and the client scripts in `server-versions/`, which users download from `main` — so a push to `main` is a release.
- The one-line installer (`install/`) is public the moment it lands on `main`. It pins the client scripts to a release tag + SHA-256 (`CLIENT_TAG`/`SHA256` in `install/install.js`): every client-script release must tag the new version and bump those constants, then run `bash install/test/run-tests.sh`. Test the installer only with a sandboxed `HOME`, never against real client configs.
- Keep `mountvacation` identifiers (tool names, `MOUNTVACATION_API_KEY`, the `X-MountVacation-API-Key` header, script file names, the legacy Worker name) unchanged; only user-facing prose uses the "MV Travel" brand.
