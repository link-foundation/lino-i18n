// A bounded reproduction of the remaining template diagnostic gap. No writes.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const archive = fileURLToPath(
  new URL(
    "../dev/log/issues/23/pulls/24/templates/js-source.tar.gz",
    import.meta.url,
  ),
);
const source = execFileSync("tar", [
  "-xOf",
  archive,
  "js/scripts/publish-retry.mjs",
]);
const { publishWithRetry } = await import(
  `data:text/javascript;base64,${source.toString("base64")}`
);
const result = await publishWithRetry({
  publish: async () => ({
    success: false,
    output: 'E409 Cannot publish over previously staged version "1.0.0"',
  }),
  verify: async () => false,
  sleepFn: async () => {},
  verifyOptions: { attempts: 2 },
  log: console.log,
});
console.log({
  success: result.success,
  publishAttempts: result.publishAttempts,
  diagnostic: result.error.message,
});
