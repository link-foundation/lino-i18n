import { test, expect } from '@playwright/test';

test('compiled JSX translates text and accessible attributes while retaining event handlers', async ({
  page,
}) => {
  await page.goto('/examples/compiler-usage/');
  await expect(page.getByRole('heading')).toHaveText(
    'Automatic source translation'
  );
  await expect(
    page.getByRole('textbox', { name: 'Search for Ada' })
  ).toHaveAttribute('placeholder', 'Search');
  await page.getByRole('button', { name: 'Add an item' }).click();
  await expect(page.locator('section p')).toHaveText('Items: 3');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('fr');
  await expect(page.getByRole('heading')).toHaveText(
    'Traduction automatique des textes'
  );
  await expect(
    page.getByRole('textbox', { name: 'Rechercher Ada' })
  ).toHaveAttribute('placeholder', 'Rechercher');
  await expect(page.locator('main > p')).toHaveText('Bonjour Ada !');
  await page.getByRole('button', { name: 'Ajouter un article' }).click();
  await expect(page.locator('section p')).toHaveText('Articles : 4');
});
