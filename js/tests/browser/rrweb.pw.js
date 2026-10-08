import { test, expect } from '@playwright/test';

test('actual recorder/player translates a .lino walkthrough while preserving variables and masking inputs', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/examples/rrweb-usage/');
  await expect(page.locator('main h2')).toHaveText('Hello Ada!');
  await page.getByRole('button', { name: 'Record walkthrough' }).click();
  await expect(
    page
      .locator('.toolbar')
      .getByRole('button', { name: 'Stop recording', exact: true })
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Add an item' }).click();
  await expect(page.locator('#count')).toHaveText('Items: 1');
  await page
    .locator('.toolbar')
    .getByRole('button', { name: 'Stop recording', exact: true })
    .click();
  await expect(page.getByRole('button', { name: 'Open replay' })).toBeEnabled();
  const evidence = await page.evaluate(() => ({
    json: JSON.stringify(window.replayBundle),
    overlay: window.replayBundle.overlay.fr,
    locales: window.replayBundle.locales,
    tags: window.replayBundle.events
      .filter((event) => event.type === 5)
      .map((event) => event.data.tag),
  }));
  expect(evidence.locales).toEqual(['en', 'fr']);
  expect(Object.values(evidence.overlay)).toContain('Bonjour ');
  expect(Object.values(evidence.overlay)).not.toContain('Adele');
  expect(evidence.json).not.toContain('private-value-6741');
  expect(evidence.json).not.toContain('private-block-1958');
  expect(evidence.tags).toContain('gt-i18n');
  await page.getByRole('button', { name: 'Open replay' }).click();
  await expect(page.locator('#replay iframe').first()).toBeVisible();
  const replay = page.locator('#replay iframe').first().contentFrame();
  await expect(replay.locator('h1')).toHaveText('Un accueil enregistré');
  await expect(replay.locator('h2')).toHaveText('Bonjour Ada !');
  await expect(replay.locator('#count')).toHaveText('Articles : 1');
  await page
    .getByRole('combobox', { name: 'Replay language' })
    .selectOption('en');
  await expect(replay.locator('h1')).toHaveText('A recorded welcome');
  await page.getByRole('button', { name: 'Close replay' }).click();
  await expect(page.locator('#replay iframe')).toHaveCount(0);
  expect(errors).toEqual([]);
});
