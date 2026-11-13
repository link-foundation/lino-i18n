import assert from 'node:assert/strict';
import test from 'node:test';
import { NPM_RECOVERY_VERSION, setupNpm } from '../scripts/setup-npm.mjs';

test('the actual bootstrap upgrades bundled npm 11 to the current release', async () => {
  const commands = [];
  await setupNpm({
    nodeVersion: 'v26.13.1',
    runner: async (command, args) => {
      commands.push([command, ...args]);
      return {
        stdout: commands.length === 1 ? '11.20.0' : NPM_RECOVERY_VERSION,
      };
    },
  });
  assert.deepEqual(commands, [
    ['npm', '--version'],
    ['npm', 'install', '-g', `npm@${NPM_RECOVERY_VERSION}`, '--ignore-scripts'],
    ['npm', '--version'],
  ]);
});

test('bootstrap rejects unsupported Node patch versions before running npm', async () => {
  for (const nodeVersion of ['22.22.1', '23.0.0', '24.14.0', '25.0.0']) {
    await assert.rejects(
      setupNpm({
        nodeVersion,
        runner: () => assert.fail('npm must not run on an unsupported Node'),
      }),
      /required for npm/
    );
  }
  for (const nodeVersion of ['22.22.2', '24.15.0', '26.0.0']) {
    const commands = [];
    await setupNpm({
      nodeVersion,
      runner: async (command, args) => {
        commands.push([command, ...args]);
        return { stdout: NPM_RECOVERY_VERSION };
      },
    });
    assert.deepEqual(commands, [['npm', '--version']]);
  }
});
