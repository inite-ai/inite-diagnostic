@AGENTS.md

## Claude Code notes

- `/contribute` — runs "From idea to PR" from AGENTS.md interactively, with
  stop points for red zones. `/spec-idea` — turns an idea into a filed issue,
  no code.
- Safe to run without asking: `npm ci`, `npm run build`, `npm test`,
  `node dist/bin.js --help|--version|whoami`.
- Ask first: `node dist/bin.js login` (opens a browser, writes a token file),
  calling remote tools (`start_audit`, `answer_audit`, `upgrade_audit` — they
  spend the account's allowance), `npm publish`.
- Keep personal permissions in `.claude/settings.local.json` (git-ignored).
