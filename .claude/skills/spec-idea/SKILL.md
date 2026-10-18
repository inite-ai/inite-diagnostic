---
name: spec-idea
description: Use when someone wants to propose an idea for inite-diagnostic (the process-diagnostic MCP server) or for the inite.solutions audit it bridges to, without writing code — turns it into a plain-language spec and files it as an issue in inite-ai/inite-diagnostic.
---

# /spec-idea — propose, don't build

Explain in plain words as you go. No code, no branches.

1. Restate the idea; ask at most 3 clarifying questions.
2. Say which part it touches: the local interview/arithmetic (runs on the
   user's machine, no network), sign-in/the bridge, or the inite.solutions
   audit — findings, premium questions, a new field, payment (server-side —
   still filed here, and labelled as such).
3. Search first:
   `gh issue list -R inite-ai/inite-diagnostic --search "<key words>" --state all`.
   If one exists, offer to comment on it instead.
4. Write the issue body with these headings: **What do you want to be
   possible?** · **Who is it for / why** · **How would you know it works?**
   (example answers and the expected output) · **Spec** (problem, what the
   tool says, tool surface change, risks, out of scope, zone from AGENTS.md).
5. Show it, get a yes, then file:
   `gh issue create -R inite-ai/inite-diagnostic --title "idea: <title>" --label idea --body-file <file>`.
   Without `gh`, give the person
   `https://github.com/inite-ai/inite-diagnostic/issues/new?template=product-idea.yml`
   and the text to paste.
6. Share the issue link and what happens next (a maintainer reviews it).

Never paste a token, or a real business's answers, into the issue — use
made-up numbers.
