import { test, expect } from '../fixtures.js';

test.describe('Web server hardening', () => {
    test('dotfiles are denied', async ({ page }) => {
        expect((await page.request.get('/.env')).status()).toBe(403);
        expect((await page.request.get('/.git/config')).status()).toBe(403);
    });

    test('responses carry the security headers', async ({ page }) => {
        const res = await page.request.get('/login');
        expect(res.status()).toBe(200);
        expect(res.headers()['x-content-type-options']).toBe('nosniff');
        expect(res.headers()['x-frame-options']).toBe('SAMEORIGIN');
        expect(res.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    test('a stray php file is not executed', async ({ page }) => {
        expect((await page.request.get('/anything.php')).status()).toBe(404);
    });
});
