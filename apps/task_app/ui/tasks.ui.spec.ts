import { test, expect } from '@playwright/test';
const api = process.env.TASK_APP_API_BASE_URL || process.env.TASK_APP_BASE_URL!;

test('UI adds, filters, completes and deletes a task', async ({ page, request }) => {
  const title = `UI automation ${crypto.randomUUID()}`;
  let id: string | undefined;
  try {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Small tasks. Clear mind.' })).toBeVisible();
    await expect(page.getByLabel('What needs to get done?')).toBeEnabled();
    await page.getByLabel('What needs to get done?').fill(title);
    const created = page.waitForResponse(r => r.url().endsWith('/api/tasks') && r.request().method() === 'POST');
    await page.getByRole('button', { name: '+ Add task', exact: true }).click();
    const response = await created;
    expect(response.status()).toBe(201);
    id = (await response.json()).id;
    const row = page.getByTestId('task-row').filter({ hasText: title });
    await expect(row).toBeVisible();
    await row.getByRole('checkbox').check();
    await expect(row.getByRole('checkbox')).toBeEnabled();
    await page.getByRole('button', { name: 'Active', exact: true }).click();
    await expect(row).toHaveCount(0);
    await page.getByRole('button', { name: 'Completed', exact: true }).click();
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: `Delete ${title}`, exact: true }).click();
    await expect(row).toHaveCount(0);
  } finally {
    if (id) await request.delete(`${api}/api/tasks/${id}`);
  }
});
