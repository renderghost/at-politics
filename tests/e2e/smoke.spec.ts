import { expect, test } from '@playwright/test';

test.describe('landing page', () => {
  test('renders without errors or horizontal overflow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('fonts.g')) errors.push(m.text()); });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your mandate.');
    await expect(page.getByRole('note')).toContainText('Speculative concept');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBe(0);
    expect(errors).toEqual([]);
  });

  test('draws the 720-seat hemicycle', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#hemicycle .seat')).toHaveCount(720);
    await expect(page.locator('#hemicycle .seat.lit')).toHaveCount(1);
  });

  test('previews the handle as the name is typed', async ({ page }) => {
    await page.goto('/');
    await page.fill('#hb-first', 'Željko');
    await page.fill('#hb-last', "O'Brien");
    await expect(page.locator('#hb-slug')).toHaveText('zeljko-obrien');
  });

  test('hero button carries the name into the reservation form', async ({ page }) => {
    await page.goto('/');
    await page.fill('#hb-first', 'Ana');
    await page.fill('#hb-last', 'Moreau');
    await page.getByRole('button', { name: 'Reserve your verified handle' }).click();
    await expect(page.locator('#rf-first')).toHaveValue('Ana');
    await expect(page.locator('#rf-handle')).toHaveText('@ana-moreau.rostrum.eu');
  });

  test('reservation form validates, then confirms', async ({ page }) => {
    await page.goto('/');
    const form = page.locator('#reserve-form');
    await form.getByRole('button', { name: 'Reserve my handle' }).click();
    await expect(form.locator('.err:not([hidden])')).toHaveCount(5);

    await page.fill('#rf-first', 'Ana');
    await page.fill('#rf-last', 'Moreau');
    await page.fill('#rf-email', 'ana@example.com');
    await page.selectOption('#rf-state', 'France');
    await page.check('#rf-consent');
    await form.getByRole('button', { name: 'Reserve my handle' }).click();
    await expect(page.locator('#rf-email-err')).toContainText('@europarl.europa.eu');

    await page.fill('#rf-email', 'ana.moreau@europarl.europa.eu');
    await form.getByRole('button', { name: 'Reserve my handle' }).click();
    await expect(page.locator('#rf-success')).toBeVisible();
    await expect(page.locator('#rf-success-handle')).toHaveText('@ana-moreau.rostrum.eu');
  });

  test('member-state list has all 27 states', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#rf-state option')).toHaveCount(28);
  });

  test('briefing form validates, then confirms', async ({ page }) => {
    await page.goto('/');
    const form = page.locator('#briefing');
    await form.getByRole('button', { name: 'Request a briefing' }).click();
    await expect(form.locator('.err:not([hidden])')).toHaveCount(3);
    await page.fill('#bf-name', 'J. Weber');
    await page.selectOption('#bf-role', 'Chief of staff');
    await page.fill('#bf-email', 'office@example.eu');
    await form.getByRole('button', { name: 'Request a briefing' }).click();
    await expect(page.locator('#bf-success')).toBeVisible();
  });
});
