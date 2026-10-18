# AGENTS.md — inite-diagnostic

Instructions for AI coding agents (Claude Code, Cursor, Codex, Copilot coding
agent, Gemini CLI, Windsurf…) working **on** this repository. Humans: the
[README](README.md) says what the package does; [CONTRIBUTING.md](CONTRIBUTING.md)
says how to propose a change.

## What this is

`@inite/diagnostic` — a stdio MCP server (`inite-diagnostic`, TypeScript) for
the INITE process diagnostic: take one business process apart and find out
what it costs. Two halves:

- **Local tools, no account, no network** — `diagnostic_questions` hands the
  calling model the eight interview fields; `read_answers` does exact,
  deterministic arithmetic on the answers and prints every assumption.
- **Remote bridge, needs a token** — `start_audit`, `answer_audit`,
  `get_audit`, `upgrade_audit` are the inite.solutions service's own tools
  (`https://inite.solutions/api/mcp`), forwarded as-is.

For whom: small-business owners and operators (and their agents) deciding
what to automate. Tokens come from INITE Auth (`https://auth-api.inite.ai`,
the INITE Triad's identity service; contract:
<https://github.com/inite-ai/inite-triad/blob/main/docs/compatibility.md>).
The service, its slot definitions and the MCP Registry manifest
(`solutions.inite/inite-diagnostic`) live in the private inite.solutions
repository — **there is no `server.json` here** (README "Registry").

## Ground rules (non-negotiable)

1. **Tool names and input schemas are a public contract.** MCP clients and
   the registry entry depend on `diagnostic_questions` (no input) and
   `read_answers` (`{ answers }` required). Never rename or remove a tool or a
   required input; add optional inputs only. A replacement ships alongside the
   old name (old one still works, description says "deprecated: use …"); the
   removal is a maintainer's decision.
2. **Slot keys are load-bearing.** `src/slots.ts` is a copy of the service's
   `src/lib/audit/slots.ts`; `answer_audit` accepts only the service's keys.
   Never rename, remove or reorder a key here on your own — a key changes in
   the service first. `SLOTS.md` is **generated** from the service's
   definitions ("not written by hand"); don't hand-edit it — ask a maintainer
   to regenerate it.
3. **The local half never touches the network.** `diagnostic_questions` and
   `read_answers` work on a plane; `test/tools.test.js` replaces `fetch` with
   one that throws. The only thing they read is the local token *file* (to
   decide whether to print the sign-in line).
4. **`read_answers` is deterministic arithmetic, not judgement.** Same answers
   → same text. Every assumption is printed ("read 50-100 as 75"); answers
   with no digits are not quantities; `__skip__` is a decline, never a guess;
   it does **not** recommend what to automate — that is the paid audit
   (`src/reading.ts` header). No model calls, no randomness, no telemetry.
5. **Remote tools are not defined here.** `listTools`/`callTool` in
   `src/index.ts` forward without copying, filtering or rewriting schemas or
   results. Signed out, no remote call is made at all.
6. **No unattended spending.** `upgrade_audit` returns a checkout link when
   nothing is paid for; never add a path that buys or charges on its own.
7. **Never log or send secrets or user data.** Tokens go only as a bearer
   header to `INITE_MCP_URL` and to the auth server during login. The token
   file (`~/.config/inite/mcp-diagnostic.json`) stays `0600`, separate from
   `@inite/visibility`'s, and `INITE_DIAGNOSTIC_TOKEN` is read before
   `INITE_TOKEN` (RFC 8707 audience binding — README "Install"). Interview
   answers are the user's business data: never log them or send them
   anywhere from a local tool.
8. **stdout is the protocol.** Human-facing lines go to stderr. No
   `console.log`.
9. **Versions move together.** `package.json` `version` and `VERSION` in
   `src/index.ts` (handshake + user-agent) are equal (`1.1.0`), and the
   registry manifest in the service repo names the same version — a bump is a
   maintainer step across both repos. release-please moves the first two
   (see Releasing); the registry manifest stays a maintainer step. Keep
   `name`, `bin` (one binary, `inite-diagnostic`) and `mcpName` unchanged.
   Never run `npm publish` yourself.
10. **Don't hand-edit `dist/`** (git-ignored `tsc` output); no new runtime
    dependencies without asking (there is one: `@modelcontextprotocol/sdk`).

## Zones

| Path | What lives there | Zone |
|---|---|---|
| `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `.github/` templates | docs | green |
| `test/*.test.js` (adding tests) | tests | green |
| `src/reading.ts` — `quantity`, `countChannels`, `readAnswers`, `formatReading` | the local arithmetic and its wording | yellow — tests required |
| `src/index.ts` `LOCAL_TOOLS` descriptions, `questionSheet()` wording | what the model reads | yellow |
| `src/bin.ts` | `login` / `whoami` / `--help` / `--version` | yellow |
| `src/slots.ts` (keys, order, `SKIPPED`), `SLOTS.md` | copy of the service's contract; generated file | red |
| `src/index.ts` `remoteCall`, `listTools`, `callTool`, tool names/schemas | bridge, public contract | red |
| `src/auth.ts` | OAuth (PKCE loopback), token storage | red |
| `package.json` (`name`, `bin`, `mcpName`, `files`, deps) | npm + registry identity | red |

Green: just do it. Yellow: needs tests + a note in the PR. Red: open an issue
with a spec first (template "Product idea"); a maintainer approves the design
before code.

## Setup

- **Codespaces / devcontainer:** "Code → Codespaces → Create" (or "Reopen in
  Container"). `.devcontainer/devcontainer.json` is a plain Node 20 image;
  `npm ci` runs on create (and builds, via `prepare`). No services needed.
- **Local:** Node `>=20` (`engines`), then `npm ci`.

## Commands

Exactly what CI runs ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

```bash
npm ci            # installs from package-lock.json; `prepare` runs the build
npm run build     # tsc → dist/ (strict: the build is the typecheck)
npm test          # npm run build && node --test test/*.test.js
```

Done = all green. Single test file:
`npm run build && node --test test/reading.test.js`. Try it by hand:
`node dist/bin.js --help`, `node dist/bin.js whoami` (stderr). No argument =
the stdio server (a client launches it). There is no lint or format script.

## Architecture map

```
src/bin.ts      CLI entry (package bin → dist/bin.js): login | whoami | --help | --version | (none) → main()
src/index.ts    the MCP server: LOCAL_TOOLS (name, description, inputSchema),
                questionSheet(), runLocal() dispatch, remoteCall() JSON-RPC to INITE_MCP_URL,
                listTools() = local (+ remote when signed in), callTool(), main()
src/slots.ts    SLOTS (the free eight), SKIPPED ("__skip__"), SLOT_KEYS, isAnswered()
src/reading.ts  quantity() / countChannels() parsers, readAnswers() → Reading, formatReading() → text
src/auth.ts     accessToken() (INITE_DIAGNOSTIC_TOKEN > INITE_TOKEN > file), login(), refresh
SLOTS.md        generated list of all 43 slots (free 8 + premium 35) — reference, not source
test/           node:test against dist/: reading (arithmetic), tools (no-network, signed-out)
```

Request flow: client → stdio → `callTool()` → local name → `runLocal()` →
`questionSheet()` or `formatReading(readAnswers(...))`; any other name → token
or `NotSignedIn` → `remoteCall("tools/call")` → result unchanged. Errors
become `isError` results with an instruction, never a crash.

**Add a local tool:**

1. Put the logic in a pure, exported function (in `src/reading.ts` or a new
   `src/<area>.ts`) — no `fetch`, no model, no randomness.
2. Add `{ name, description, inputSchema }` to `LOCAL_TOOLS` in
   `src/index.ts`. The input is a JSON Schema object; list in `required` only
   what is truly required. The description must end "Runs locally, no account
   needed." (a test checks every local tool says "no account needed").
3. Add the branch to `runLocal()`; validate the input shape and return
   `fail("<what to pass instead>")` on a wrong one.
4. Tests: the pure function in `test/reading.test.js` style, and the tool via
   `callTool()` inside `withoutNetwork(signedOut(...))` in
   `test/tools.test.js`.
5. Add a row to the README "Tools" table.

## From idea to PR

The loop you run **with** the human (Claude Code: `/contribute` runs it):

1. Restate the idea in plain words; ask at most 3 clarifying questions.
2. Find where it fits (Zones). Check for an existing issue:
   `gh issue list -R inite-ai/inite-diagnostic --search "<words>" --state all`.
   If it is about the audit, the findings, the premium questions or a new
   slot, it belongs to the inite.solutions service — file an idea issue and
   say so.
3. Write a short spec: problem, user-visible behaviour (what the tool says),
   tool surface change, risks, out of scope. **Red zone → stop**, open an
   issue with the spec (template "Product idea"), and wait for a maintainer.
4. Plan small steps.
5. Implement with tests (tests first where practical — the reading tests are
   the model).
6. Run all of "Commands".
7. Update the README where behaviour or tools changed.
8. Commit: conventional commits (`feat(reading): …`, `fix: …`, `docs: …`,
   `!` for breaking). The first commits are plain sentences; new commits use
   the conventional form. The commit type decides the next version (see
   Releasing).
9. Open a PR with the template filled, explaining the change to a
   non-engineer too.

## Conventions

- TypeScript, `strict`, ESM (`"module": "NodeNext"` — import local files with
  a `.js` suffix). Two styles coexist in `src/`: `index.ts`, `auth.ts`,
  `bin.ts` use double quotes and semicolons; `slots.ts` and `reading.ts` use
  single quotes and no semicolons. Tests use double quotes and semicolons. No
  formatter is configured — match the file you are in.
- Block comments say **why** (the failure prevented, the competence split);
  keep that density.
- A tool failure is a result (`fail(message)` → `isError: true`) whose message
  says what to pass instead.
- Numbers in output always show how they were read; prefer saying "unknown"
  to assuming.
- Branches: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`. One behaviour per PR.

## Testing

`node:test` + `node:assert/strict`, files `test/<area>.test.js`, importing
from `../dist/*.js` (`npm test` builds first). No test may reach the network:
wrap local-tool tests in `withoutNetwork()` and `signedOut()` from
`test/tools.test.js` (the latter points `INITE_DIAGNOSTIC_TOKEN_FILE` at a
nonexistent path). Model for new arithmetic: "a range becomes its midpoint and
says so" in `test/reading.test.js`. CI runs `npm ci`, `npm run build`,
`npm test`.

## Releasing

release-please (`.github/workflows/release-please.yml`) reads the
conventional commits on `main` and keeps a release PR open (`fix` → patch,
`feat` → minor, `!` → major). Merging that PR bumps `package.json` and
`VERSION`, writes `CHANGELOG.md`, tags `vX.Y.Z` and, in the same run,
publishes to npm with provenance (`publish-npm.yml`, secret `NPM_TOKEN`). A
version already on npm is skipped, so dispatching release-please by hand
publishes whatever `main` carries and a re-run is safe.

## When to ask a human

- anything in a red zone (slots, bridge, auth, package identity);
- renaming/removing a tool, an input, a command or an env var;
- anything that would make the local half call the network, a model or a paid API;
- anything that spends money or changes what `upgrade_audit` does;
- adding a runtime dependency; a version bump or a release;
- the change needs the inite.solutions service (or its registry manifest) to change;
- you would need a real token or account to verify it.

## Help

Issues: <https://github.com/inite-ai/inite-diagnostic/issues> (templates:
product idea, bug). Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).
Security: do **not** open a public issue — report privately via
[SECURITY.md](SECURITY.md) (GitHub private vulnerability reporting, or
security@inite.ai). Claude Code: `/contribute` runs
the loop above; `/spec-idea` only files an idea.
