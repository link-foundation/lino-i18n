import { test, expect } from '@playwright/test';

test('React source content, nested nodes, plural and currency update in Chromium', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/examples/react-usage/');
  await expect(page.getByRole('heading')).toHaveText('Welcome, Ada!');
  await expect(page.locator('#items')).toHaveText('2 items in your cart');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('fr');
  await expect(page.getByRole('heading')).toHaveText('Ada, bienvenue !');
  await expect(page.locator('h1 strong')).toHaveText('Ada');
  await expect(page.locator('#items')).toHaveText(
    '2 articles dans votre panier'
  );
  await expect(page.locator('#total')).toContainText('25,00');
  await page.getByRole('button', { name: 'Ajouter un article' }).click();
  await expect(page.locator('#items')).toHaveText(
    '3 articles dans votre panier'
  );
  await expect(page.locator('main')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('main')).toHaveAttribute('dir', 'ltr');
  expect(errors).toEqual([]);
});
