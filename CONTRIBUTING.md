# Contributing to inite-diagnostic

Thanks for helping. The short version:

- **Have an idea, not code?** Open an issue with the
  [Product idea](https://github.com/inite-ai/inite-diagnostic/issues/new?template=product-idea.yml)
  template. Plain words are fine.
- **Found a bug?** Open a
  [Bug report](https://github.com/inite-ai/inite-diagnostic/issues/new?template=bug_report.yml)
  with the input and what the tool said. Use made-up answers and never paste a
  token.
- **Want to change code?** [AGENTS.md](AGENTS.md) is the source of truth — for
  people and AI agents alike: ground rules, zones, the exact commands CI runs
  (`npm ci`, `npm run build`, `npm test`), the architecture map, and the
  idea → PR loop. With Claude Code, open the repo and run `/contribute`; with
  any other agent, say "read AGENTS.md and help me with …".

The audit itself, its fields and the registry manifest live in the
inite.solutions service, not here; ideas about them are still welcome as
issues. Changes to the slot list, the bridge, sign-in or the package identity
(red zones in AGENTS.md) start as an issue that a maintainer approves before
code.

Security problems: please don't open a public issue — see [SECURITY.md](SECURITY.md).
