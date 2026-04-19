import { test, expect } from '@playwright/test';

const PAGES = ['/', '/about.html', '/about-me.html', '/contact.html'];

test.describe('smoke: page loads and structural expectations', () => {
  for (const path of PAGES) {
    test(`${path} responds 200 with title and description`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(/.+/);
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description).toBeTruthy();
      expect(description!.length).toBeGreaterThan(40);
      const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(ogImage).toBeTruthy();
      expect(consoleErrors).toEqual([]);
    });
  }
});

test('nav: active link matches current page', async ({ page }) => {
  await page.goto('/about.html');
  const active = page.locator('a.nav-link.active');
  await expect(active).toHaveText(/How it works/i);
});

test('prefers-reduced-motion: video is hidden', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const videoDisplay = await page.locator('.hero video').evaluate(el =>
    window.getComputedStyle(el).display
  );
  expect(videoDisplay).toBe('none');
  await context.close();
});

test('compliance tripwire: no hard-coded financial or customer-count strings', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    const bodyText = await page.locator('body').innerText();
    const moneyPattern = /\$[\d,]+\s*(MRR|ARR|revenue|monthly)/i;
    const countPattern = /\b\d{3,}\s*(customers|users|subscribers|members)\b/i;
    expect(moneyPattern.test(bodyText), `${path}: matched money pattern`).toBe(false);
    expect(countPattern.test(bodyText), `${path}: matched customer-count pattern`).toBe(false);
  }
});
