// Explain every retained npm version using the actual lockfile and semver.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import semver from "../js/node_modules/semver/index.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "dev/log/issues/43/pulls/44/registry");
const { packages } = JSON.parse(
  readFileSync(resolve(root, "js/package-lock.json")),
);
const registry = JSON.parse(readFileSync(resolve(out, "latest.json"))).npm;
const parents = {};
function installedAt(parent, name) {
  let prefix = parent;
  while (true) {
    const candidate = `${prefix ? `${prefix}/` : ""}node_modules/${name}`;
    if (packages[candidate]) return candidate;
    if (!prefix) return undefined;
    prefix = prefix.slice(0, Math.max(0, prefix.lastIndexOf("/node_modules/")));
  }
}
for (const [path, item] of Object.entries(packages)) {
  for (const section of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    for (const [alias, requested] of Object.entries(item[section] ?? {})) {
      const target = installedAt(path, alias);
      if (!target) continue;
      const dep = packages[target];
      const name = dep.name ?? alias;
      const latest = registry[name]?.version;
      if (!latest || dep.version === latest) continue;
      const range = requested.startsWith("npm:")
        ? requested.slice(requested.lastIndexOf("@") + 1)
        : requested;
      (parents[target] ??= []).push({
        parent: path
          ? `${item.name ?? path.split("node_modules/").at(-1)}@${item.version}`
          : "lino-i18n (root)",
        section,
        range,
        latestAllowed: semver.satisfies(latest, range),
      });
    }
  }
}
writeFileSync(
  resolve(out, "npm-parents.json"),
  `${JSON.stringify(parents, null, 2)}\n`,
);
console.log(
  `Explained ${Object.keys(parents).length} retained package locations.`,
);
