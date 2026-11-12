import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

interface Mep { id: string; slug: string; givenName: string; familyName: string; country: string; group: string; email?: string }
const meps: Mep[] = JSON.parse(readFileSync('data/meps.json', 'utf8')).meps;
const links: Array<{ mepId: string; handle: string }> = JSON.parse(readFileSync('data/atmosphere.json', 'utf8')).links;
const linked = new Set(links.map((l) => l.mepId));
const withAccount = meps.find((m) => linked.has(m.id))!;
const withoutAccount = meps.find((m) => !linked.has(m.id))!;

function firstPartyErrors(page: Page, origin: string): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const source = m.location().url;
    if (source && !source.startsWith(origin)) return;
    errors.push(`${m.text()} (${source || 'inline'})`);
  });
  return errors;
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
}

test.describe('homepage: MEPs already on the Atmosphere', () => {
  test('shows the real count, cross-party cards and all nine groups', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#on-the-atmosphere');
    await expect(section.getByRole('heading', { level: 2 })).toContainText(`${links.length} of ${meps.length} MEPs`);
    await expect(section.locator('.atmo-card')).toHaveCount(Math.min(12, links.length));
    await expect(section.locator('.group-bars li')).toHaveCount(9);
    await expect(section).toContainText('not Rostrum users and have not endorsed Rostrum');
    await expect(section.getByRole('link', { name: `See all ${meps.length} Members` })).toHaveAttribute('href', '/meps/');
  });
});

test.describe('directory', () => {
  test('lists every Member and filters by name, group and Atmosphere', async ({ page, baseURL }) => {
    const errors = firstPartyErrors(page, baseURL!);
    await page.goto('/meps/');
    await expect(page.locator('.dir-item')).toHaveCount(meps.length);
    await expect(page.locator('#dir-count')).toHaveText(`Showing ${meps.length} of ${meps.length} Members`);

    await page.fill('#dir-q', withAccount.familyName);
    await expect(page.locator('.dir-item:visible').first()).toContainText(withAccount.familyName);
    await page.fill('#dir-q', '');

    const groupTotal = meps.filter((m) => m.group === withAccount.group).length;
    await page.selectOption('#dir-group', withAccount.group);
    await expect(page.locator('#dir-count')).toHaveText(`Showing ${groupTotal} of ${meps.length} Members`);
    await page.selectOption('#dir-group', '');

    await page.check('#dir-atmo');
    await expect(page.locator('#dir-count')).toHaveText(`Showing ${links.length} of ${meps.length} Members`);

    await page.fill('#dir-q', 'zzzz-nobody');
    await expect(page.locator('#dir-empty')).toBeVisible();
    await noOverflow(page);
    expect(errors).toEqual([]);
  });
});

test.describe('draft profile', () => {
  test('shows the confirmed account, the disclaimer and a claim link', async ({ page, baseURL }) => {
    const errors = firstPartyErrors(page, baseURL!);
    await page.goto(`/meps/${withAccount.slug}/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${withAccount.givenName} ${withAccount.familyName}`);
    await expect(page.getByRole('note')).toContainText(['Speculative concept']);
    await expect(page.locator('.draft-note')).toContainText('Not created or endorsed by this Member');
    const handle = links.find((l) => l.mepId === withAccount.id)!.handle;
    await expect(page.locator('.mp-atmo-handle')).toHaveText(`@${handle}`);
    await expect(page.getByRole('link', { name: 'Claim this profile' })).toHaveAttribute('href', `/?mep=${withAccount.id}#reserve`);
    await noOverflow(page);
    expect(errors).toEqual([]);
  });

  test('says plainly when no account is confirmed', async ({ page }) => {
    await page.goto(`/meps/${withoutAccount.slug}/`);
    await expect(page.locator('.mp-none')).toBeVisible();
    await expect(page.locator('.mp-atmo-handle')).toHaveCount(0);
  });
});

test.describe('find yourself', () => {
  test('a claim link pre-fills the reservation form', async ({ page }) => {
    await page.goto(`/?mep=${withAccount.id}#reserve`);
    await expect(page.locator('#rf-found')).toContainText(`Found you: ${withAccount.givenName} ${withAccount.familyName}`);
    await expect(page.locator('#rf-first')).toHaveValue(withAccount.givenName);
    await expect(page.locator('#rf-last')).toHaveValue(withAccount.familyName);
    await expect(page.locator('#rf-state')).toHaveValue(withAccount.country);
    if (withAccount.email) await expect(page.locator('#rf-email')).toHaveValue(withAccount.email);
  });

  test('picking a name from the list fills the form', async ({ page }) => {
    await page.goto('/');
    await page.locator('#rf-find').focus();
    await page.fill('#rf-find', `${withoutAccount.givenName} ${withoutAccount.familyName} (${withoutAccount.country})`);
    await expect(page.locator('#rf-first')).toHaveValue(withoutAccount.givenName);
    await expect(page.locator('#rf-state')).toHaveValue(withoutAccount.country);
  });
});
