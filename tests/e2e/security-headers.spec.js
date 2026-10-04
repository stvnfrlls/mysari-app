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

    test('plain http gets no HSTS header', async ({ page }) => {
        const res = await page.request.get('/login');
        expect(res.headers()['strict-transport-security']).toBeUndefined();
    });

    test('a request the TLS proxy marks as https gets HSTS', async ({ page }) => {
        const res = await page.request.get('/login', {
            headers: { 'X-Forwarded-Proto': 'https' },
        });
        expect(res.headers()['strict-transport-security']).toBe('max-age=31536000');
    });

    test('a stray php file is not executed', async ({ page }) => {
        expect((await page.request.get('/anything.php')).status()).toBe(404);
    });
});
