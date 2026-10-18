#!/usr/bin/env node
import { login, TOKEN_PATH, accessToken, envToken } from "./auth.js";
import { main, REMOTE, VERSION } from "./index.js";

/**
 * Two modes, and the default is the one a client launches.
 *
 * With no argument this process is an MCP server speaking stdio, so nothing
 * may be written to stdout that is not a protocol message — every human-facing
 * line in this package goes to stderr for that reason.
 */

const [, , cmd] = process.argv;

async function run(): Promise<void> {
  switch (cmd) {
    case "login":
      await login();
      return;

    case "whoami": {
      const token = await accessToken();
      const source = envToken()?.source ?? TOKEN_PATH;
      process.stderr.write(
        token
          ? `Signed in. Token from ${source}.\n`
          : `Not signed in. The interview and the arithmetic work anyway; \`npx @inite/diagnostic login\` adds the audit.\n`,
      );
      process.exitCode = token ? 0 : 1;
      return;
    }

    case "--version":
    case "-v":
      process.stderr.write(`${VERSION}\n`);
      return;

    case "--help":
    case "-h":
      process.stderr.write(
        [
          `inite-diagnostic ${VERSION} — a business process audit as an MCP tool`,
          ``,
          `  inite-diagnostic            run as an MCP server over stdio (what a client does)`,
          `  inite-diagnostic login      sign in to inite.solutions in your browser`,
          `  inite-diagnostic whoami     say whether a usable token is present`,
          ``,
          `  Two tools work signed out: the interview sheet and the arithmetic on`,
          `  what it collects. Signing in adds the audit — the next question chosen`,
          `  from what you have already said, the findings, and a saved run.`,
          ``,
          `  INITE_DIAGNOSTIC_TOKEN   use this token instead of the stored one`,
          `  INITE_MCP_URL            point at a different endpoint (default ${REMOTE})`,
          ``,
        ].join("\n"),
      );
      return;

    default:
      if (cmd) {
        process.stderr.write(`Unknown command: ${cmd}. Try --help.\n`);
        process.exitCode = 2;
        return;
      }
      await main();
  }
}

run().catch((e: Error) => {
  process.stderr.write(`${e.message}\n`);
  process.exitCode = 1;
});
