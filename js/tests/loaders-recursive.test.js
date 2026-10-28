import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadLocalesFromDirectory } from '../src/loaders.js';
import { createI18n } from '../src/node-i18n.js';

async function withCatalogues(run) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'lino-recursive-'));
  try {
    await fs.mkdir(path.join(root, 'prompts/system'), { recursive: true });
    await fs.writeFile(path.join(root, 'en.lino'), 'en\n  ui "UI"\n');
    await fs.writeFile(
      path.join(root, 'prompts/system/bundle.lino'),
      'en\n  instruction "Hello, {{name}}!"\nfr\n  instruction "Bonjour, {name}!"\n'
    );
    await run(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

test('recursive loading merges nested catalogs by declared locale', async () => {
  await withCatalogues(async (root) => {
    const catalogues = await loadLocalesFromDirectory(root, {
      recursive: true,
    });
    assert.deepEqual(catalogues, {
      en: { ui: 'UI', instruction: 'Hello, {{name}}!' },
      fr: { instruction: 'Bonjour, {name}!' },
    });
    const i18n = createI18n({
      locales: catalogues,
      defaultLocale: 'fr',
      fallback: ['en'],
    });
    assert.equal(i18n.t('instruction', { name: 'Ada' }), 'Bonjour, Ada!');
    assert.equal(i18n.t('ui'), 'UI');
    i18n.setLocale('de');
    assert.equal(i18n.t('instruction', { name: 'Ada' }), 'Hello, Ada!');
  });
});

test('directory loading remains shallow by default and with recursive false', async () => {
  await withCatalogues(async (root) => {
    for (const options of [undefined, { recursive: false }]) {
      assert.deepEqual(await loadLocalesFromDirectory(root, options), {
        en: { ui: 'UI' },
      });
    }
  });
});

test('recursive loading uses sorted depth-first entries and later keys win', async () => {
  await withCatalogues(async (root) => {
    // Create in reverse order, include case ordering and a directory ending in .lino.
    await fs.writeFile(path.join(root, 'z.lino'), 'en\n  winner "last file"\n');
    await fs.writeFile(
      path.join(root, 'prompts/system/z.lino'),
      'en\n  winner "deep"\n  nested "deep"\n'
    );
    await fs.writeFile(
      path.join(root, 'prompts/a.lino'),
      'en\n  winner "parent"\n  nested "parent"\n'
    );
    await fs.mkdir(path.join(root, 'A-directory.lino'));
    await fs.writeFile(
      path.join(root, 'A-directory.lino/en.lino'),
      'en\n  case "upper"\n'
    );
    await fs.writeFile(
      path.join(root, 'a-file.lino'),
      'en\n  case "lower"\n  block "first block"\nen\n  block "last block"\n'
    );
    await fs.writeFile(
      path.join(root, 'prompts/ignored.txt'),
      'invalid catalog'
    );
    const loaded = await loadLocalesFromDirectory(root, { recursive: true });
    assert.equal(loaded.en.winner, 'last file');
    assert.equal(loaded.en.nested, 'deep');
    assert.equal(loaded.en.case, 'lower');
    assert.equal(loaded.en.block, 'last block');
    assert.deepEqual(
      await loadLocalesFromDirectory(root, { recursive: true }),
      loaded
    );
  });
});

test('nested compatibility aliases expand only after all explicit keys merge', async () => {
  await withCatalogues(async (root) => {
    await fs.writeFile(
      path.join(root, 'en.lino'),
      'en\n  error.invalid_url "Explicit"\n'
    );
    await fs.writeFile(
      path.join(root, 'prompts/system/en.lino'),
      'en\n  error\n    invalid\n      url "Canonical"\n  prompt\n    system\n      body "Instructions"\n  button\n    label "Go"\n'
    );
    const canonical = await loadLocalesFromDirectory(root, { recursive: true });
    assert.equal(canonical.en['prompt.system_body'], undefined);
    for (const options of [
      { compatibilityAliases: ['collapseTail', 'parentLabel'] },
      { mode: ['collapse-tail', 'parent-label'] },
    ]) {
      const { en } = await loadLocalesFromDirectory(root, {
        recursive: true,
        ...options,
      });
      assert.equal(en['error.invalid.url'], 'Canonical');
      assert.equal(en['error.invalid_url'], 'Explicit');
      assert.equal(en.button, 'Go');
      assert.equal(en['prompt.system_body'], 'Instructions');
    }
  });
});

test('recursive loading propagates nested parsing and filesystem errors', async () => {
  await withCatalogues(async (root) => {
    await fs.writeFile(
      path.join(root, 'prompts/bad.lino'),
      'en\n  broken "unterminated'
    );
    await assert.rejects(
      loadLocalesFromDirectory(root, { recursive: true }),
      /unterminated/
    );
    assert.deepEqual(await loadLocalesFromDirectory(root), {
      en: { ui: 'UI' },
    });
    await assert.rejects(
      loadLocalesFromDirectory(path.join(root, 'missing'), { recursive: true }),
      { code: 'ENOENT' }
    );
  });
});

test('recursive loading skips symlinks including directory cycles', async (t) => {
  await withCatalogues(async (root) => {
    try {
      await fs.symlink(root, path.join(root, 'prompts/system/cycle'), 'dir');
      await fs.symlink(
        path.join(root, 'en.lino'),
        path.join(root, 'link.lino'),
        'file'
      );
    } catch (error) {
      if (error.code === 'EPERM') {
        t.skip('Symlink creation requires privileges on this platform');
        return;
      }
      throw error;
    }
    assert.equal(
      (await loadLocalesFromDirectory(root, { recursive: true })).en
        .instruction,
      'Hello, {{name}}!'
    );
  });
});
