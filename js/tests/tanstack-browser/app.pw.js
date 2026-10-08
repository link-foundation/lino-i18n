import { test, expect } from '@playwright/test';
test('Start server functions and hydrated navigation retain request locale and state', async ({
  page,
  context,
  request,
}) => {
  const html = await (await request.get('/fr')).text();
  expect(html).toContain('Bonjour Ada');
  expect(html).toContain('lang="fr"');
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/en?view=all#content');
  await expect(page.locator('main')).toHaveAttribute('data-hydrated', 'true');
  await expect(page.getByRole('heading')).toHaveText(
    'TanStack source translation'
  );
  await page.getByRole('button', { name: 'Count 0' }).click();
  await expect(page.getByRole('button', { name: 'Count 1' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Language' }).selectOption('fr');
  await expect(page).toHaveURL(/\/fr\?view=all#content$/);
  await expect(page.getByRole('button', { name: 'Compteur 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Server greeting' }).click();
  await expect(page.getByRole('status')).toHaveText('Bonjour du serveur');
  await expect(
    page.getByRole('link', { name: 'Details', exact: true })
  ).toHaveAttribute('href', '/fr/details?from=home#content');
  expect(
    (await context.cookies()).find(({ name }) => name === 'locale')?.value
  ).toBe('fr');
  await page.getByRole('link', { name: 'Details', exact: true }).click();
  await expect(page).toHaveURL(/\/fr\/details\?from=home#content$/);
  expect(errors).toEqual([]);
});
test('Start preloading and cancelled links preserve preference until navigation', async ({
  page,
  context,
}) => {
  await page.goto('/en');
  await expect(page.locator('main')).toHaveAttribute('data-hydrated', 'true');
  await page.getByTestId('foreign-link').hover();
  await page.getByTestId('blocked-link').click();
  await expect(page).toHaveURL(/\/en$/);
  expect(
    (await context.cookies()).find(({ name }) => name === 'locale')?.value
  ).not.toBe('fr');
  await page.getByTestId('foreign-link').click();
  await expect(page).toHaveURL(/\/fr\/details$/);
  await expect(page.getByRole('heading')).toHaveText(
    'Traduction des textes avec TanStack'
  );
  expect(
    (await context.cookies()).find(({ name }) => name === 'locale')?.value
  ).toBe('fr');
});
