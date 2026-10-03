import { test as base, expect } from '@playwright/test';
import { workerDb } from './support/exec.js';

export const test = base.extend({
    context: async ({ context }, use) => {
        await context.addCookies([
            { name: 'test_db', value: workerDb(), url: 'http://localhost:8000' },
        ]);
        await use(context);
    },
});

export { expect };
