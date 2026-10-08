#!/usr/bin/env node
// Run the actual package test through its Windows branch with fatal deprecations.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../js/", import.meta.url));
const source = readFileSync(
  new URL("../js/tests/package-metadata.test.js", import.meta.url),
  "utf8",
)
  .replace(/const packageRoot = .*?;/s, "const packageRoot = process.argv[1];")
  .replace(
    "const isWindows = process.platform === 'win32';",
    "const isWindows = true;",
  );
const result = spawnSync(
  "node",
  ["--throw-deprecation", "--input-type=module", "--eval", source, root],
  {
    encoding: "utf8",
  },
);
console.log(result.stdout);
console.error(result.stderr);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
