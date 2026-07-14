const { test, expect } = require('@playwright/test');
const { PNG } = require('pngjs');
const jsQR = require('jsqr');

async function openOptions(page) {
  const details = page.locator('.qr-options');
  if (!(await details.getAttribute('open'))) await details.locator('summary').click();
}

async function selectType(page, type) {
  await page.locator(`.qr-type[data-type="${type}"]`).click();
}

async function generate(page) {
  await page.locator('#generate-qr').click();
  await expect(page.locator('#qr-preview canvas')).toBeVisible();
}

function decodePng(buffer) {
  const png = PNG.sync.read(buffer);
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height, { inversionAttempts: 'attemptBoth' });
  return decoded && decoded.data;
}

function logoPng(width = 20, height = 20) {
  const png = new PNG({ width, height });
  for (let index = 0; index < png.data.length; index += 4) { png.data[index] = 30; png.data[index + 1] = 64; png.data[index + 2] = 175; png.data[index + 3] = 255; }
  return PNG.sync.write(png);
}

test.beforeEach(async ({ page }) => { await page.goto('/qr'); });

test('all nine QR types build their expected payloads', async ({ page }) => {
  const scenarios = [
    ['url', { url: 'example.com' }, value => value === 'https://example.com/'],
    ['text', { text: 'Hello QR' }, value => value === 'Hello QR'],
    ['email', { email: 'qr@example.com', subject: 'Hello', message: 'Test message' }, value => value === 'mailto:qr@example.com?subject=Hello&body=Test+message'],
    ['phone', { phone: '+63 912-345-6789' }, value => value === 'tel:+63 912-345-6789'],
    ['sms', { phone: '+639123456789', message: 'Meet me' }, value => value === 'sms:+639123456789?body=Meet%20me'],
    ['wifi', { ssid: 'Office', password: 'secret123' }, value => value === 'WIFI:T:WPA;S:Office;P:secret123;H:false;;'],
    ['vcard', { firstName: 'Ana', lastName: 'Cruz', email: 'ana@example.com' }, value => value.includes('BEGIN:VCARD') && value.includes('FN:Ana Cruz')],
    ['location', { latitude: '16.4164', longitude: '120.5931' }, value => value === 'geo:16.4164,120.5931'],
    ['event', { title: 'Planning', start: '2026-07-14T09:00', end: '2026-07-14T10:00' }, value => value.includes('BEGIN:VCALENDAR') && value.includes('SUMMARY:Planning')]
  ];
  for (const [type, fields, verify] of scenarios) {
    await selectType(page, type);
    for (const [name, value] of Object.entries(fields)) await page.locator(`.qr-form-panel:not([hidden]) [name="${name}"]`).fill(value);
    await generate(page); expect(verify(await page.locator('#qr-payload').textContent())).toBe(true);
  }
});

test('live input and design changes regenerate while invalid input clears stale output', async ({ page }) => {
  await page.locator('[name="url"]').fill('example.com'); await generate(page);
  const firstCanvas = await page.locator('#qr-preview canvas').screenshot();
  await page.locator('[name="url"]').fill('openai.com'); await expect(page.locator('#qr-payload')).toHaveText('https://openai.com/', { timeout: 2000 });
  const secondCanvas = await page.locator('#qr-preview canvas').screenshot(); expect(firstCanvas.equals(secondCanvas)).toBe(false);
  await openOptions(page); await page.locator('[name="foregroundHex"]').fill('#1e40af'); await expect(page.locator('[name="foregroundColor"]')).toHaveValue('#1e40af');
  await page.locator('[name="url"]').fill('javascript:alert(1)');
  await expect(page.locator('#download-png')).toBeDisabled(); await expect(page.locator('#qr-payload')).toBeEmpty(); await expect(page.locator('#qr-preview canvas')).toHaveCount(0);
});

test('color validation and payload capacity prevent unreliable generation', async ({ page }) => {
  await page.locator('[name="url"]').fill('example.com'); await openOptions(page);
  await page.locator('[name="foregroundHex"]').fill('#fff'); await page.locator('#generate-qr').click(); await expect(page.locator('#qr-error-summary')).toContainText('six-digit hexadecimal');
  await page.locator('[name="foregroundHex"]').fill('#ffffff'); await page.locator('[name="backgroundHex"]').fill('#ffffff'); await page.locator('#generate-qr').click(); await expect(page.locator('#qr-error-summary')).toContainText('more contrast');
  await selectType(page, 'text'); await page.evaluate(() => { const input = document.querySelector('[name="text"]'); input.value = 'é'.repeat(700); input.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#generate-qr').click(); await expect(page.locator('#qr-error-summary')).toContainText('too large for H error correction');
});

test('logo lifecycle validates, previews, forces H, and removes in-memory data', async ({ page }) => {
  await page.locator('[name="url"]').fill('example.com'); await openOptions(page);
  await page.locator('[name="logo"]').setInputFiles({ name: 'logo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.locator('#qr-error-summary')).toContainText('PNG, JPEG, or WebP');
  await page.locator('[name="logo"]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: logoPng() });
  await expect(page.locator('#logo-preview')).toBeVisible(); await expect(page.locator('#logo-preview-image')).toHaveAttribute('src', /^blob:/);
  await expect(page.locator('[name="errorCorrectionLevel"]')).toHaveValue('H'); await expect(page.locator('[name="errorCorrectionLevel"]')).toBeDisabled();
  await generate(page); await page.locator('#remove-logo').click(); await expect(page.locator('#logo-preview')).toBeHidden(); await expect(page.locator('[name="errorCorrectionLevel"]')).toBeEnabled();
  await page.locator('[name="logo"]').setInputFiles({ name: 'huge.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await expect(page.locator('#qr-error-summary')).toContainText('smaller than 2 MB');
  await page.locator('[name="logo"]').setInputFiles({ name: 'wide.png', mimeType: 'image/png', buffer: logoPng(2001, 1) });
  await expect(page.locator('#qr-error-summary')).toContainText('2,000 × 2,000');
});

test('preview, PNG, and SVG exports preserve a decodable URL payload', async ({ page, context }) => {
  await page.locator('[name="url"]').fill('https://example.com/qr-check'); await page.locator('[name="label"]').fill('Project Board'); await generate(page);
  expect(decodePng(await page.locator('#qr-preview canvas').screenshot())).toBe('https://example.com/qr-check');
  const pngDownloadPromise = page.waitForEvent('download'); await page.locator('#download-png').click(); const pngDownload = await pngDownloadPromise;
  expect(pngDownload.suggestedFilename()).toBe('hellotasks-qr-project-board.png'); expect(decodePng(await require('fs').promises.readFile(await pngDownload.path()))).toBe('https://example.com/qr-check');
  const svgDownloadPromise = page.waitForEvent('download'); await page.locator('#download-svg').click(); const svgDownload = await svgDownloadPromise;
  expect(svgDownload.suggestedFilename()).toBe('hellotasks-qr-project-board.svg'); const svg = await require('fs').promises.readFile(await svgDownload.path()); expect(svg.toString()).toMatch(/<svg[\s>]/);
  const rasterPage = await context.newPage(); await rasterPage.setContent(`<style>body{margin:0}img{display:block;width:800px;height:800px}</style><img alt="QR" src="data:image/svg+xml;base64,${svg.toString('base64')}">`); await expect(rasterPage.locator('img')).toBeVisible();
  expect(decodePng(await rasterPage.locator('img').screenshot())).toBe('https://example.com/qr-check'); await rasterPage.close();
});

test('clipboard, reset, keyboard controls, and status announcements are accessible', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']); await page.locator('[name="url"]').fill('example.com'); await generate(page);
  await page.locator('.qr-payload summary').click(); await page.locator('#copy-payload').click(); expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://example.com/'); await expect(page.locator('#qr-status')).toContainText('copied');
  await page.locator('.qr-type[data-type="url"]').focus(); await page.keyboard.press('ArrowRight'); await expect(page.locator('.qr-type[data-type="text"]')).toBeFocused(); await expect(page.locator('.qr-type[data-type="text"]')).toHaveAttribute('aria-checked', 'true');
  expect(await page.locator('.qr-type[data-type="text"]').evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
  page.once('dialog', dialog => dialog.accept()); await page.locator('#reset-qr').click(); await expect(page.locator('.qr-type[data-type="url"]')).toHaveAttribute('aria-checked', 'true'); await expect(page.locator('[name="url"]')).toHaveValue(''); await expect(page.locator('[name="foregroundHex"]')).toHaveValue('#000000');
});

for (const width of [320, 375, 425, 768, 1024, 1440]) {
  test(`layout has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/qr');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    if (width === 320) {
      await expect(page.getByRole('link', { name: 'Help & scanning tips' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Sign in' })).toBeHidden();
      expect(await page.locator('.qr-type').first().evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    }
  });
}

test('missing library and forced renderer, download, and clipboard failures are user-facing', async ({ page }) => {
  await page.goto('/qr-missing-library'); await expect(page.locator('#qr-error-summary')).toContainText('temporarily unavailable');
  await page.goto('/qr'); await page.locator('[name="url"]').fill('example.com');
  await page.evaluate(() => { window.QRCodeStyling = function () { throw new Error('forced'); }; }); await page.locator('#generate-qr').click(); await expect(page.locator('#qr-error-summary')).toContainText('could not be generated');
  await page.reload(); await page.locator('[name="url"]').fill('example.com'); await generate(page);
  await page.evaluate(() => { window.QRCodeStyling.prototype.download = () => Promise.reject(new Error('forced')); }); await page.locator('#download-png').click(); await expect(page.locator('#qr-error-summary')).toContainText('PNG could not be downloaded');
  await page.reload(); await page.locator('[name="url"]').fill('example.com'); await generate(page); await page.locator('.qr-payload summary').click();
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('forced')) } }); });
  await page.locator('#copy-payload').click(); await expect(page.locator('#qr-error-summary')).toContainText('could not be copied');
});

test('PWA manifest, service worker, and offline QR workflow are available', async ({ page, context, request }) => {
  const manifestResponse = await request.get('/qr/manifest.webmanifest'); expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json(); expect(manifest.name).toBe('HelloTasks QR Creator'); expect(manifest.start_url).toBe('/qr'); expect(manifest.display).toBe('standalone'); expect(manifest.icons.map(icon => icon.sizes)).toEqual(['192x192', '512x512']);
  await page.evaluate(() => navigator.serviceWorker.ready.then(registration => registration.active && registration.active.state));
  await page.reload(); await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  const cachedPages = await page.evaluate(async () => ({ creator: (await (await fetch('/qr')).text()).includes('Create a QR code'), help: (await (await fetch('/qr/help')).text()).includes('Make QR codes that scan reliably') }));
  expect(cachedPages).toEqual({ creator: true, help: true });
  await page.locator('[name="url"]').fill('offline.example'); await generate(page); await expect(page.locator('#qr-payload')).toHaveText('https://offline.example/');
  await context.setOffline(false);
});
