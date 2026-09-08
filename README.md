# INITE Diagnostic — a process audit your agent can run

Point an assistant at a business process and get back what it costs today,
where it breaks first, and what to automate next.

```
> Our WhatsApp enquiries take until morning to answer. Is that worth fixing?

  start_audit(language: "en")        → audit_token: 9f2c…, first question
  answer_audit(field: "channels", value: "whatsapp, instagram")
  answer_audit(field: "dailyInquiries", value: "50-100")
  …
  answer_audit(finish: true)         → findings
```

It is the same audit that runs at
[inite.solutions/en/audit](https://inite.solutions/en/audit).

## Two depths

**Free — eight questions about one process.** Pick the thing your people still
do by hand. The interview maps it and says what it costs now and what changes
if it runs itself. No account needed in the browser; from an agent, the
interview and the arithmetic need none either — see
[Works before you sign in](#works-before-you-sign-in) — and the reading itself
needs one.

**Premium — forty-three slots across the whole business**, grouped into
strategy, marketing, operations, finance and technology. The interview has a
budget of thirty-five questions against those forty-three slots, so it must
leave some unasked, and choosing which is the part worth having a model for. It
routes by the share of each area still open, not by the count, so one expert
cannot conduct two thirds of the conversation.

The first eight slots of a premium run are the free eight, unchanged. An audit
that upgrades mid-way is not asked them twice.

## Works before you sign in

Two of the tools run entirely on your machine. No account, no allowance, no
call home.

`diagnostic_questions` hands over the interview itself — the eight things a
diagnostic has to establish, in the words they are asked in — and your
assistant conducts it, in the person's own language, with options that look
like their industry. `read_answers` then does the arithmetic on what came back.

```
> Eighty enquiries a day between the two of us, mostly WhatsApp, kept in a spreadsheet.

  read_answers(answers: {...})

  From what you have been told:
    80 enquiries a day across 2 people — 40 each.
    12 of them become leads — 15% of what arrives.
    3 channels enquiries arrive on. The record of them: a spreadsheet.

  That is the arithmetic. What it cannot do is say what to automate first.
```

The split falls where the competences do. A model conducts an interview far
better than it divides eighty by two and remembers what the range said, so the
caller asks and this counts — and every assumption it had to make is printed
beside the result ("read 50-100 as 75").

Signing in adds the audit itself: the next question chosen from everything
already said, the findings written against them, a run saved under your account
that you can come back to, and the forty-three question depth.

## Install

**Claude Desktop, Cursor, or any client that launches a stdio server:**

```json
{
  "mcpServers": {
    "inite-diagnostic": {
      "command": "npx",
      "args": ["-y", "@inite/diagnostic"]
    }
  }
}
```

Then, when you want the audit rather than the arithmetic:

```sh
npx @inite/diagnostic login
```

That opens a browser, you approve, and the token is stored at
`~/.config/inite/mcp-diagnostic.json` with owner-only permissions.
Authorization code with PKCE over a loopback redirect, the flow RFC 8252
prescribes for a native app. Nothing is written to the repository and no secret
ships in the package.

**Its own file, not the one `@inite/visibility` writes.** Both tokens are
issued by the same authorization server and belong to the same person, and
neither works in the other's place: RFC 8707 binds each one to the `resource`
it was asked for. Sharing a file would mean the second `login` silently
replaced the first one's token with something that 401s. For the same reason
this package reads `INITE_DIAGNOSTIC_TOKEN` before `INITE_TOKEN`.

## Tools

| tool | what it does | account |
|---|---|---|
| `diagnostic_questions` | The eight fields, in the words they are asked in, for you to interview from | no |
| `read_answers` | The arithmetic on what you collected, with every assumption stated | no |
| `start_audit` | Begins the interview, returns the first question and an `audit_token` | yes |
| `answer_audit` | Records one answer against the field the question named, returns the next question — or the findings when the interview is over | yes |
| `get_audit` | Depth, what was answered, what was declined, what is still open, and the findings if they exist | yes |
| `upgrade_audit` | Spends a paid run if the account has one; otherwise returns a checkout link | yes |

`upgrade_audit` deliberately stops short of buying. With nothing paid for on
the account it hands back a URL for a person to open. An agent is not given a
way to spend somebody's money unattended.

### Answers the model does not have

`"__skip__"` is a valid answer and a better one than a guess. A guessed answer
produces a confident wrong finding, which is worse than a gap the audit can
name — and the findings say what they could not tell rather than inventing it.

### Fields are a closed list

Every question names the field it fills, and that name comes from a fixed list.
The model chooses which slot to raise next, how to word it and what to offer as
answers; it does not choose what the answers are called. This is enforced by
the schema rather than checked afterwards — the field is an enum built per call
from what is still missing, so a question about anything else cannot be
expressed.

That constraint exists because the version without it failed in a specific way:
the panel stayed empty while the visitor answered, and the lead reached the CRM
as a wall of JSON under "Industry: N/A".

The full list, generated from the server's own definitions, is in
[SLOTS.md](SLOTS.md).

## Connect without the package

A client that speaks the MCP authorization flow can talk to the remote server
directly. There are no local tools that way — the two above live in the
package — and every call needs a token.

```json
{
  "mcpServers": {
    "inite-diagnostic": {
      "type": "http",
      "url": "https://inite.solutions/api/mcp"
    }
  }
}
```

## Authentication

Every call to the *remote* server needs a bearer token, and the only thing
available without one is how to get a token. The two local tools need nothing.

An unauthenticated request returns `401` with a `WWW-Authenticate` header
pointing at
[`/.well-known/oauth-protected-resource`](https://inite.solutions/.well-known/oauth-protected-resource),
which names `auth.inite.ai` as the authorization server. A client that speaks
the MCP authorization flow walks that chain on its own: it registers, a human
approves in a browser, and every run after that belongs to somebody.

An agent is the same person arriving through a different door, so the quota,
the entitlement and the audit rows are the account's own — not a second class
of user with a separate allowance.

## Registry

Published as `solutions.inite/inite-diagnostic`. The namespace is proved by an
ed25519 key served at
[`/.well-known/mcp-registry-auth`](https://inite.solutions/.well-known/mcp-registry-auth).

The manifest that publishes it lives beside the server itself rather than here,
so there is one copy of it and no way for the two to disagree. This repository
is the readable half: what the server is, what it asks, and what it will not do.

## The rest of the family

| server | what it is for |
|---|---|
| [`ai.inite/inite-visibility`](https://github.com/inite-ai/inite-visibility) | Whether the answer engines can see a website |
| `club.inite/inite-club` | Membership, events, the shared workspace |
| `studio.inite/ideaudit-tools` | The scoring behind an audit allowed to say no |
| [`io.github.inite-ai/inite-brain-service`](https://github.com/inite-ai/inite-brain-service) | Bitemporal memory for agents |

## License

MIT. See [LICENSE](LICENSE).
