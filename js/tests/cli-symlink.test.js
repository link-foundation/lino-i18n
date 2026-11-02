// Regression tests for https://github.com/link-foundation/lino-i18n/issues/39:
// npm installs the `lino-i18n` bin as a symlink, so the CLI must run when it
// is invoked through a symlinked path (`npx lino-i18n`, `node_modules/.bin`).
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { isCliEntryPoint } from '../bin/lino-i18n.js';

const binPath = fileURLToPath(new URL('../bin/lino-i18n.js', import.meta.url));

// Creates `<tmp>/.bin/lino-i18n -> bin/lino-i18n.js`, mirroring npm's layout.
// Returns null when the platform refuses symlinks (e.g. Windows without
// Developer Mode), in which case the scenario cannot occur there either.
async function makeBinSymlink() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'lino-i18n-symlink-'));
  const linkDir = path.join(tmp, '.bin');
  await fs.mkdir(linkDir);
  const linkPath = path.join(linkDir, 'lino-i18n');
  try {
    await fs.symlink(binPath, linkPath, 'file');
  } catch (error) {
    if (error?.code === 'EPERM' || error?.code === 'EACCES') {
      await fs.rm(tmp, { recursive: true, force: true });
      return null;
    }
    throw error;
  }
  return { tmp, linkPath };
}

function runNode(args, cwd) {
  return spawnSync('node', args, { cwd, encoding: 'utf8', timeout: 20000 });
}

test('isCliEntryPoint resolves symlinks before comparing paths', async () => {
  const setup = await makeBinSymlink();
  if (!setup) {
    return;
  }
  try {
    assert.equal(isCliEntryPoint(setup.linkPath, binPath), true);
    assert.equal(isCliEntryPoint(binPath, binPath), true);
    assert.equal(
      isCliEntryPoint(path.join(setup.tmp, 'missing.js'), binPath),
      false
    );
    assert.equal(isCliEntryPoint(undefined, binPath), false);
    assert.equal(isCliEntryPoint(setup.tmp, binPath), false);
  } finally {
    await fs.rm(setup.tmp, { recursive: true, force: true });
  }
});

test('CLI run through a bin symlink reports check failures', async () => {
  const setup = await makeBinSymlink();
  if (!setup) {
    return;
  }
  try {
    const localesDir = path.join(setup.tmp, 'locales');
    await fs.mkdir(localesDir);
    await fs.writeFile(
      path.join(localesDir, 'ui.lino'),
      'en\n  a\n    b "x"\nru\n  a\n    c "y"\n'
    );

    const check = runNode(
      [setup.linkPath, 'check', '--dir', localesDir, '--reference', 'en'],
      setup.tmp
    );
    assert.equal(check.status, 2, check.stderr);
    assert.match(check.stdout, /# ru/);
    assert.match(check.stdout, /missing: a\.b/);
    assert.match(check.stdout, /unknown: a\.c/);

    const help = runNode([setup.linkPath, '--help'], setup.tmp);
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /Usage: lino-i18n <command>/);
  } finally {
    await fs.rm(setup.tmp, { recursive: true, force: true });
  }
});
