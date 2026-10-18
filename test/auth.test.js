import assert from "node:assert/strict";
import { test } from "node:test";
import { accessToken, envToken } from "../dist/auth.js";

/**
 * Which token is sent decides whether somebody who just signed in is told
 * they are not. The precedence is INITE_DIAGNOSTIC_TOKEN, then INITE_TOKEN,
 * then the file — and a variable that is set but blank is not a token, so it
 * must not stop the search.
 */

const NAMES = ["INITE_DIAGNOSTIC_TOKEN", "INITE_TOKEN", "INITE_DIAGNOSTIC_TOKEN_FILE"];

function withEnv(env, fn) {
  return async () => {
    const saved = Object.fromEntries(NAMES.map((n) => [n, process.env[n]]));
    for (const n of NAMES) delete process.env[n];
    // No stored token, so only the environment can answer.
    process.env.INITE_DIAGNOSTIC_TOKEN_FILE = "/nonexistent/inite-diagnostic-test.json";
    Object.assign(process.env, env);
    try {
      await fn();
    } finally {
      for (const n of NAMES) {
        if (saved[n] === undefined) delete process.env[n];
        else process.env[n] = saved[n];
      }
    }
  };
}

test(
  "a blank INITE_DIAGNOSTIC_TOKEN does not hide a valid INITE_TOKEN",
  withEnv({ INITE_DIAGNOSTIC_TOKEN: "  \n", INITE_TOKEN: " shared-token " }, async () => {
    assert.equal(await accessToken(), "shared-token");
    assert.deepEqual(envToken(), { token: "shared-token", source: "INITE_TOKEN" });
  }),
);

test(
  "INITE_DIAGNOSTIC_TOKEN still wins when it holds a token, trimmed",
  withEnv({ INITE_DIAGNOSTIC_TOKEN: " diag-token\n", INITE_TOKEN: "shared-token" }, async () => {
    assert.equal(await accessToken(), "diag-token");
    assert.equal(envToken()?.source, "INITE_DIAGNOSTIC_TOKEN");
  }),
);

test(
  "two blank variables and no file are signed out",
  withEnv({ INITE_DIAGNOSTIC_TOKEN: " ", INITE_TOKEN: "\t" }, async () => {
    assert.equal(envToken(), null);
    assert.equal(await accessToken(), null);
  }),
);
