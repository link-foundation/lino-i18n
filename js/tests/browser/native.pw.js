import { test, expect } from '@playwright/test';

test('Native Text retains nested props and presses through persisted locale changes', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/examples/native-usage/');
  await expect(page.getByTestId('title')).toHaveText(
    'Native source translation'
  );
  await page.getByRole('button', { name: 'Français' }).click();
  await expect(page.getByTestId('greeting')).toHaveText('Bonjour Ada !');
  await expect(page.getByTestId('amount')).toContainText('0,00');
  await expect(page.getByTestId('name')).toHaveCSS('font-weight', '700');
  await page.getByTestId('name').click();
  await expect(page.getByTestId('count')).toHaveText('Articles : 3');
  await page.getByRole('button', { name: 'Ajouter un article' }).click();
  await expect(page.getByTestId('count')).toHaveText('Articles : 4');
  await page.reload();
  await expect(page.getByTestId('title')).toHaveText(
    'Traduction des textes natifs'
  );
  await expect(page.getByTestId('stored')).toHaveText(
    'Langue enregistrée : fr'
  );
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByTestId('greeting')).toHaveText('Hello Ada!');
  expect(errors).toEqual([]);
});

test('Native failed catalog selection preserves content and persisted language', async ({
  page,
}) => {
  await page.goto('/examples/native-usage/');
  await page.getByRole('button', { name: 'Deutsch' }).click();
  await expect(page.getByRole('alert')).toHaveText('Catalog unavailable');
  await expect(page.getByTestId('title')).toHaveText(
    'Native source translation'
  );
  await page.reload();
  await expect(page.getByTestId('title')).toHaveText(
    'Native source translation'
  );
});
