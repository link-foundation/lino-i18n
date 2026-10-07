import { test, expect } from '@playwright/test';
import { build } from 'esbuild';

function bundleExport(name) {
  return build({
    stdin: {
      contents: `export { ${name} } from 'lino-i18n/browser';`,
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: 'browser',
    format: 'esm',
    write: false,
    metafile: true,
  });
}

test('native browser modules fetch catalogs and switch language at runtime', async ({
  page,
}) => {
  const errors = [];
  const catalogs = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.url().endsWith('.lino')) {
      catalogs.push(response.status());
    }
  });
  await page.goto('/examples/browser-usage/');
  await expect(page.locator('#greeting')).toHaveText('Привет, Ada!');
  await expect(page.locator('#items')).toHaveText('2 предмета');
  await expect(page.locator('#fallback')).toHaveText(
    'This text falls back to English.'
  );
  await expect(page.getByRole('combobox', { name: 'Language' })).toHaveValue(
    'ru'
  );
  await page.getByRole('combobox', { name: 'Language' }).selectOption('en');
  await expect(page.locator('#greeting')).toHaveText('Hello, Ada!');
  await expect(page.locator('#items')).toHaveText('2 items');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(catalogs).toEqual([200, 200]);
  expect(errors).toEqual([]);
});

test('public browser export bundles without Node built-ins and tree-shakes unused loading code', async ({
  page,
}) => {
  const result = await bundleExport('createI18n');
  const output = result.outputFiles[0].text;
  expect(output).not.toContain('loadCatalogs');
  expect(
    Object.keys(result.metafile.inputs).some((file) =>
      /node:|loaders\.js|node-i18n\.js/.test(file)
    )
  ).toBe(false);
  await page.goto('/examples/browser-usage/');
  const translated = await page.evaluate(async (source) => {
    const { createI18n } = await import(
      URL.createObjectURL(new Blob([source], { type: 'text/javascript' }))
    );
    return createI18n({ locales: { en: { key: 'Bundled {{value}}' } } }).t(
      'key',
      { value: 'runtime' }
    );
  }, output);
  expect(translated).toBe('Bundled runtime');
  const languageOnly = await bundleExport('resolveLanguage');
  expect(languageOnly.outputFiles[0].text).not.toMatch(
    /loadCatalogs|parseLocaleTrees|createI18n/
  );
});
