---
name: contribute
description: Use when someone says "I have an idea", "I want to add / change / fix something" in inite-diagnostic (the INITE process-diagnostic MCP server — local interview + arithmetic, plus the inite.solutions audit bridge) — runs idea → spec → plan → change → tests → gates → PR, stopping at red zones and explaining each step in plain words.
---

# /contribute — inite-diagnostic

The person may not be an engineer. Say what you are doing, and why, in plain
words at every step. `AGENTS.md` is the source of truth; re-read the section a
step names when unsure.

## 1. Understand

Restate the idea in two or three plain sentences. Ask at most 3 clarifying
questions — only ones whose answer changes what gets built.

## 2. Does it belong here?

This repo holds the **two local tools** (`diagnostic_questions`,
`read_answers`) and a **bridge**. The audit itself — choosing the next
question, the findings, the premium 43 slots, payment — lives in the
inite.solutions service. A new or renamed interview field is a service change
first (AGENTS.md rule 2). If the idea is about those, say so, offer
`/spec-idea` to file it, and stop.

Search first:
`gh issue list -R inite-ai/inite-diagnostic --search "<key words>" --state all`.

## 3. Zone and spec

Find the zone in AGENTS.md "Zones"; tell the person which and what it means.
Spec: problem · what the tool will say (an example input and output) · tool
surface change (new tool or new **optional** input only) · risks · out of
scope.

- **Red** (`src/slots.ts`, `SLOTS.md`, the bridge in `src/index.ts`,
  `src/auth.ts`, renaming/removing a tool or input, `package.json` identity):
  **stop.** Show the spec, get a yes, file it with the "Product idea" template
  (`/spec-idea` does this), and explain that a maintainer approves the design
  before code.
- Anything that would make the local tools use the network, a model, or
  guess where the person declined (`__skip__`) breaks a ground rule — say so
  and don't build it.

## 4. Plan, then build — tests first

Branch from `main`: `git switch -c feat/<slug>`. Follow AGENTS.md
"Architecture map → Add a local tool" (or change the matching function in
`src/reading.ts`). Write the test first in `test/reading.test.js` (pure
arithmetic) or `test/tools.test.js` (through `callTool`, inside
`withoutNetwork(signedOut(...))`), watch it fail, then implement. Every number
the output prints must show how it was read.

## 5. Gates

Run, and show the person the result:

```bash
npm ci
npm run build
npm test
```

All green, or explain what failed and fix it. Never skip or delete a test.

## 6. Commit and PR

Conventional commits (`feat(reading): …`, `fix: …`, `docs: …`). No version
bump unless a maintainer asked for a release (AGENTS.md rule 9). Then:

```bash
git push -u origin HEAD
gh pr create --fill   # then edit the body to follow .github/PULL_REQUEST_TEMPLATE.md
```

Fill every section: plain-language summary, zone, gates, tests, AI-assisted
disclosure. Share the link and what happens next: CI runs, a maintainer
reviews.
