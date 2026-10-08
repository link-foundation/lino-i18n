import { execFileSync } from 'node:child_process';
import { test } from 'test-anywhere';

test('the browser test environment supports Native Web styles and restores globals', () => {
  const script = `
    import assert from 'node:assert/strict';
    import { setupDOM } from './tests/helpers/dom.js';
    const keys = ['window', 'document', 'HTMLElement', 'ShadowRoot', 'DOMParser', 'Element', 'Node', 'IS_REACT_ACT_ENVIRONMENT'];
    const originals = keys.map(key => Object.getOwnPropertyDescriptor(globalThis, key));
    const dispose = setupDOM();
    await import('react-native-web');
    assert.ok(document.querySelector('style'), 'Native Web installs its stylesheet');
    dispose();
    assert.deepEqual(keys.map(key => Object.getOwnPropertyDescriptor(globalThis, key)), originals);
  `;
  execFileSync('node', ['--input-type=module', '-e', script], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
});
