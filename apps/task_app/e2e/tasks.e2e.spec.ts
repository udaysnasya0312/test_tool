import { test, expect } from '@playwright/test';
const api = process.env.TASK_APP_API_BASE_URL || process.env.TASK_APP_BASE_URL!;

test('E2E task created in UI persists in API and after reload', async ({ page, request }) => {
  const title = `E2E automation ${crypto.randomUUID()}`;
  let id: string | undefined;
  try {
    await page.goto('/');
    await expect(page.getByLabel('What needs to get done?')).toBeEnabled();
    await page.getByLabel('What needs to get done?').fill(title);
    const created = page.waitForResponse(r => r.url().endsWith('/api/tasks') && r.request().method() === 'POST');
    await page.getByRole('button', { name: '+ Add task', exact: true }).click();
    const response = await created;
    expect(response.status()).toBe(201);
    id = (await response.json()).id;
    const list = await request.get(`${api}/api/tasks`);
    expect(list.status()).toBe(200);
    expect(await list.json()).toContainEqual(expect.objectContaining({ id, title, completed: false }));
    await page.reload();
    await expect(page.getByTestId('task-row').filter({ hasText: title })).toBeVisible();
  } finally {
    if (id) await request.delete(`${api}/api/tasks/${id}`);
  }
});
