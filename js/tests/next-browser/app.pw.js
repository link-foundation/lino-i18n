import { test, expect } from '@playwright/test';

test('App Router hydrates, changes locale with cookies, and localizes links and metadata', async ({
  page,
  context,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  await page.goto('/en?view=all#content');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByTestId('server')).toHaveText('Hello from the server');
  await expect(page.getByTestId('server')).toHaveAttribute(
    'data-cached',
    'true'
  );
  await expect(page.getByTestId('server')).toHaveAttribute(
    'data-source-cached',
    'true'
  );
  await page.getByRole('button', { name: 'Count 0' }).click();
  await expect(page.getByRole('button', { name: 'Count 1' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Language' }).selectOption('fr');
  await expect(page).toHaveURL(/\/fr\?view=all#content$/);
  await expect(page.getByTestId('server')).toHaveText('Bonjour du serveur');
  await expect(page.getByText('Bonjour Ada')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(
    page.getByRole('link', { name: 'Static route', exact: true })
  ).toHaveAttribute('href', '/fr/static?from=home#content');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://example.org/fr/'
  );
  expect(
    (await context.cookies()).find(({ name }) => name === 'locale')?.value
  ).toBe('fr');
  await page.getByRole('link', { name: 'Static route', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Page statique' })
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('Next request negotiation remains isolated across simultaneous server requests', async ({
  request,
}) => {
  const results = await Promise.all(
    ['en', 'fr', 'en', 'fr'].map(async (locale) => {
      const response = await request.get('/api/context', {
        headers: { 'accept-language': locale },
      });
      expect(response.ok()).toBeTruthy();
      return response.json();
    })
  );
  expect(results).toEqual([
    { locale: 'en', message: 'Hello from the server' },
    { locale: 'fr', message: 'Bonjour du serveur' },
    { locale: 'en', message: 'Hello from the server' },
    { locale: 'fr', message: 'Bonjour du serveur' },
  ]);
});

test('unknown asset paths return 404 instead of treating filenames as locale codes', async ({
  request,
}) => {
  const response = await request.get('/missing.ico');
  expect(response.status()).toBe(404);
});

test('prefetching another locale keeps the current preference until link navigation', async ({
  page,
  context,
}) => {
  const prefetch = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === '/fr/static' && url.searchParams.has('_rsc');
  });
  await page.goto('/en');
  await prefetch;
  expect(
    (await context.cookies()).find(({ name }) => name === 'locale')?.value
  ).toBe('en');
  await page.getByTestId('blocked-link').click();
  await expect(page).toHaveURL(/\/en$/);
  expect(
    (await context.cookies()).find(({ name }) => name === 'locale')?.value
  ).toBe('en');
  await page.getByTestId('foreign-link').click();
  await expect(
    page.getByRole('heading', { name: 'Page statique' })
  ).toBeVisible();
  expect(
    (await context.cookies()).find(({ name }) => name === 'locale')?.value
  ).toBe('fr');
});
