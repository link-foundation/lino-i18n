import { test, expect } from '@playwright/test';

test('Vue hydrates SSR rich nodes and retains handlers through locale changes', async ({
  page,
  request,
}) => {
  const html = await (
    await request.get('/examples/vue-usage/?locale=fr')
  ).text();
  expect(html).toContain('Bonjour');
  expect(html).toContain('lang="fr"');
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('Hydration')) {
      errors.push(message.text());
    }
  });
  await page.goto('/examples/vue-usage/?locale=fr');
  await expect(page.getByRole('heading')).toHaveText(
    'Traduction des textes avec Vue'
  );
  await page.getByRole('button', { name: 'Ajouter un article' }).click();
  await expect(page.locator('.count')).toHaveText('Articles : 3');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('en');
  await expect(page.getByRole('heading')).toHaveText('Vue source translation');
  await expect(page.locator('.greeting')).toHaveText('Hello Ada!');
  await page.getByRole('button', { name: 'Add an item' }).click();
  await expect(page.locator('.count')).toHaveText('Items: 4');
  await expect(page.locator('strong')).toHaveAttribute(
    'title',
    'Code-owned name'
  );
  expect(errors).toEqual([]);
});

test('Vue restores selection and reports a failed lazy catalog without losing content', async ({
  page,
}) => {
  await page.goto('/examples/vue-usage/');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('de');
  await expect(page.getByRole('status')).toHaveText('Catalog unavailable');
  await expect(page.getByRole('combobox', { name: 'Language' })).toHaveValue(
    'en'
  );
  await expect(page.getByRole('heading')).toHaveText('Vue source translation');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('fr');
  await expect(page.locator('.greeting')).toHaveText('Bonjour Ada !');
});
