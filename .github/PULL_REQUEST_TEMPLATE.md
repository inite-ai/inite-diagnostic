## What this changes, in plain words

<!-- Two or three sentences a non-engineer can follow: what someone running the diagnostic through their agent will notice. -->

## Zone

<!-- See "Zones" in AGENTS.md. -->
- [ ] green
- [ ] yellow — what could change for existing users:
- [ ] red — approved issue: #

Tool surface (tool names, inputs, descriptions) changed? no / yes — new tool or optional input only:
Versions bumped (`package.json` + `src/index.ts` `VERSION`, together; registry manifest in the service repo)? no / yes
Slot keys (`src/slots.ts`) or `SLOTS.md` changed? no / yes — matching service change:

## Gates

- [ ] `npm ci`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] CI green on this PR

## Tests

- [ ] tests added or changed (`test/…`) — or why not:
- [ ] README updated where behaviour or tools changed

## AI-assisted

<!-- Disclosure, not judgement. -->
- [ ] no
- [ ] yes — agent:
