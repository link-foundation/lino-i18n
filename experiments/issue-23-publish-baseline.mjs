// Execute the original publisher's actual orchestration with deterministic I/O.
// No network, publish, Git mutation or real retry delay is allowed in this probe.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';

const source = execFileSync('git', ['show', 'c082a8c:js/scripts/publish-to-npm.mjs'], { encoding: 'utf8' });
const body = source.slice(source.indexOf('const MAX_RETRIES'));
let publishes = 0;
let reads = 0;
let exitCode = 0;
const command = (strings) => ({
  run: async () => {
    if (strings.join('').includes('changeset:publish')) {
      publishes++;
      return { code: publishes === 1 ? 0 : 1, stdout: publishes === 1 ? 'packages published successfully' : 'Cannot publish over previously staged version' };
    }
    reads++;
    return { code: reads < 4 ? 1 : 0, stdout: reads < 4 ? '' : '0.3.0' };
  },
});
const context = {
  console, $: command, shouldPull: false, jsRoot: '.', needsCd: () => false,
  readPackageInfo: () => ({ name: 'fixture', version: '0.3.0' }),
  formatNpmPackageVersion: (name, version) => `${name}@${version}`,
  process: { cwd: () => '.', chdir() {}, env: {}, exit(code) { exitCode = code; } },
  appendFileSync() {}, setTimeout: (resolve) => resolve(),
};
await vm.runInNewContext(body.replace(/main\(\);\s*$/, 'main();'), context);
assert.equal(publishes, 1, 'accepted versions must never be republished on a read miss');
assert.equal(exitCode, 0, 'delayed registry visibility should eventually verify');
