import assert from "node:assert/strict";
import { test } from "node:test";
import { callTool, listTools, LOCAL_TOOLS } from "../dist/index.js";
import { SLOT_KEYS } from "../dist/slots.js";

/**
 * The free half has to be free of the network, not merely free of charge.
 *
 * "Runs locally, no account needed" is written into both local tool
 * descriptions, and a description is not a mechanism. If either one ever
 * reached for the remote — for a slot list, for a check, for anything — it
 * would still work on this machine and fail on a plane, behind a proxy, and
 * for anyone who has not signed in. So the test takes the network away.
 */
function withoutNetwork(run) {
  const real = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("the local half must not call home");
  };
  return (async () => {
    try {
      return await run();
    } finally {
      globalThis.fetch = real;
    }
  })();
}

/** No stored token and no environment token: the signed-out case. */
function signedOut(run) {
  const env = { ...process.env };
  delete process.env.INITE_DIAGNOSTIC_TOKEN;
  delete process.env.INITE_TOKEN;
  process.env.INITE_DIAGNOSTIC_TOKEN_FILE = "/nonexistent/inite-diagnostic-test.json";
  return (async () => {
    try {
      return await run();
    } finally {
      process.env = env;
    }
  })();
}

test("the interview sheet lists every field the service will accept", async () => {
  const res = await withoutNetwork(() => signedOut(() => callTool("diagnostic_questions", {})));
  const text = res.content[0].text;
  for (const key of SLOT_KEYS) {
    assert.ok(text.includes(key), `${key} is missing from the sheet the agent interviews from`);
  }
  assert.match(text, /__skip__/, "a declinable question that never says so is not declinable");
});

test("the arithmetic runs with the network taken away", async () => {
  const res = await withoutNetwork(() =>
    signedOut(() => callTool("read_answers", { answers: { dailyInquiries: "50-100", teamSize: "2" } }))
  );
  assert.ok(!res.isError, res.content[0].text);
  assert.match(res.content[0].text, /38 each/);
});

test("answers in the wrong shape get an instruction, not a stack trace", async () => {
  const res = await withoutNetwork(() => signedOut(() => callTool("read_answers", { answers: "80 a day" })));
  assert.equal(res.isError, true);
  assert.match(res.content[0].text, /object keyed by field/);
});

test("a signed-out client is offered working tools rather than an empty list", async () => {
  const tools = await withoutNetwork(() => signedOut(() => listTools()));
  assert.equal(tools.tools.length, LOCAL_TOOLS.length);
  assert.deepEqual(
    tools.tools.map((t) => t.name).sort(),
    LOCAL_TOOLS.map((t) => t.name).sort()
  );
});

test("a remote tool asked for while signed out says how to sign in", async () => {
  const res = await signedOut(() => callTool("start_audit", { language: "en" }));
  assert.equal(res.isError, true);
  assert.match(res.content[0].text, /npx @inite\/diagnostic login/);
  assert.match(res.content[0].text, /INITE_DIAGNOSTIC_TOKEN/);
});

test("both local tools say in their own description that they need no account", () => {
  for (const tool of LOCAL_TOOLS) {
    assert.match(
      tool.description,
      /no account needed/,
      `${tool.name} is offered to signed-out clients and does not say so`
    );
  }
});
