import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { accessToken } from "./auth.js";
import { SLOTS, SKIPPED } from "./slots.js";
import { formatReading } from "./reading.js";

/**
 * Two halves, and only one of them needs an account.
 *
 * The local half hands over the interview itself — the eight things a
 * diagnostic has to establish, in the words they are asked in — and then does
 * arithmetic on whatever comes back. That works the moment the package is
 * installed, on a plane, for nothing, because the list is a list and division
 * is division. A server that does nothing until you sign in is a server nobody
 * gets to the second screen of.
 *
 * It is also genuinely useful rather than a teaser, and it is useful for a
 * reason specific to this protocol: the client is a model. It can conduct an
 * interview far better than it can divide eighty by two and remember what the
 * range said. So the split falls where the competences fall — the caller asks,
 * this counts.
 *
 * The remote half is the part that spends something real: a model choosing
 * what to ask next from what it already knows, then reading eight or
 * forty-three answers against each other and writing the findings. Those run
 * against an account, with its own allowance and its own saved audits, exactly
 * as on the website.
 *
 * For the remote half this process defines no schemas: it asks
 * https://inite.solutions/api/mcp what it offers and forwards calls there, so
 * the tool list stays whatever the service implements today. A local copy
 * would be a second source of truth, and the first thing it would do is drift.
 */

export const REMOTE = process.env.INITE_MCP_URL ?? "https://inite.solutions/api/mcp";
export const VERSION = "1.1.0";

export class NotSignedIn extends Error {
  constructor() {
    super(
      "Not signed in to inite.solutions. Run `npx @inite/diagnostic login`, or set INITE_DIAGNOSTIC_TOKEN in this server's environment.",
    );
  }
}

/** Everything here runs locally. No account, no allowance, no call home. */
export const LOCAL_TOOLS = [
  {
    name: "diagnostic_questions",
    description:
      "The eight things a process diagnostic has to establish, in the order they are usually asked. Use them to interview the person yourself — one question at a time, in their language, with options that look like their industry rather than a generic list. Then pass what you collected to read_answers. Runs locally, no account needed.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "read_answers",
    description:
      "Do the arithmetic on a set of collected answers: enquiries per person, the share that become leads, how many channels arrive without one record, and which of the eight are still blank. Every assumption it had to make is printed beside the result. It stops short of saying what to automate — that is the audit, and it needs an account. Runs locally, no account needed.",
    inputSchema: {
      type: "object",
      properties: {
        answers: {
          type: "object",
          description:
            'What you have collected, keyed by field: {"industry": "…", "dailyInquiries": "50-100", …}. Use "__skip__" for a question that was declined — it is a better answer than a guess.',
        },
      },
      required: ["answers"],
    },
  },
] as const;

const LOCAL_NAMES = new Set<string>(LOCAL_TOOLS.map((t) => t.name));

const fail = (message: string) => ({
  content: [{ type: "text", text: message }],
  isError: true,
});

type LocalName = (typeof LOCAL_TOOLS)[number]["name"];

function questionSheet(): string {
  return [
    "Eight fields. Ask them one at a time, in the person's own language, and",
    "offer options that look like their industry rather than a generic list.",
    "",
    ...SLOTS.map(
      (slot, i) =>
        `${String(i + 1).padStart(2, "0")}  ${slot.key}${slot.multiple ? " (several may be true)" : ""}\n      ${slot.asks}`,
    ),
    "",
    `A question may be declined: record "${SKIPPED}" rather than a guess. A guessed`,
    "answer produces a confident wrong finding, which is worse than a gap.",
    "",
    "When you have what they will give you, call read_answers with them.",
  ].join("\n");
}

async function runLocal(name: LocalName, args: Record<string, unknown>) {
  if (name === "diagnostic_questions") {
    return { content: [{ type: "text", text: questionSheet() }] };
  }

  const answers = args.answers;
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return fail(
      'Pass the answers you collected as an object keyed by field, e.g. {"dailyInquiries": "50-100", "teamSize": "2"}. Call diagnostic_questions for the field names.',
    );
  }

  // Whether to print the offer at the end is the one thing the local half asks
  // the network about, and it asks its own disk: a signed-in caller does not
  // need to be told twice where to sign in.
  const signedIn = Boolean(await accessToken().catch(() => null));
  return {
    content: [
      { type: "text", text: formatReading(answers as Record<string, unknown>, signedIn) },
    ],
  };
}

let nextId = 1;

/** One JSON-RPC round trip to the remote server. */
export async function remoteCall(
  method: string,
  params: Record<string, unknown> | undefined,
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<any> {
  const res = await fetchImpl(REMOTE, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      authorization: `Bearer ${token}`,
      "user-agent": `inite-diagnostic/${VERSION}`,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  });

  if (res.status === 401) throw new NotSignedIn();
  if (!res.ok) throw new Error(`inite.solutions answered ${res.status} for ${method}.`);

  const body = (await res.json()) as { result?: unknown; error?: { message?: string } };
  if (body.error) throw new Error(body.error.message ?? `${method} failed.`);
  return body.result;
}

/**
 * The tool list: local always, remote when there is a token.
 *
 * A signed-out client sees two working tools and one line on stderr saying
 * what signing in would add — not an empty list that reads as a broken server.
 */
export async function listTools(): Promise<{ tools: unknown[] }> {
  const local = [...LOCAL_TOOLS];
  try {
    const token = await accessToken();
    if (!token) {
      process.stderr.write(
        `Signed out: the interview and the arithmetic are available. \`npx @inite/diagnostic login\` adds the audit itself — the questions chosen from what you have already said, the findings, and the saved run you can come back to.\n`,
      );
      return { tools: local };
    }
    const remote = (await remoteCall("tools/list", undefined, token)) as { tools?: unknown[] };
    return { tools: [...local, ...(remote.tools ?? [])] };
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    return { tools: local };
  }
}

type ToolResult = { content: { type: string; text: string }[]; isError?: boolean };

export async function callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    if (LOCAL_NAMES.has(name)) return await runLocal(name as LocalName, args);

    const token = await accessToken();
    if (!token) throw new NotSignedIn();
    const result = (await remoteCall("tools/call", { name, arguments: args }, token)) as ToolResult;
    return result;
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function main(): Promise<void> {
  const server = new Server(
    { name: "inite-diagnostic", version: VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => (await listTools()) as never);
  server.setRequestHandler(CallToolRequestSchema, async (req) =>
    callTool(req.params.name, (req.params.arguments ?? {}) as Record<string, unknown>),
  );

  await server.connect(new StdioServerTransport());
}
