import { test, expect } from '@playwright/test';
const api = process.env.TASK_APP_API_BASE_URL || process.env.TASK_APP_BASE_URL!;

test('API health endpoint is available', async ({ request }) => {
  const response = await request.get(`${api}/api/health`);
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok' });
});

test('API creates, completes and deletes a task', async ({ request }) => {
  const title = `API automation ${crypto.randomUUID()}`;
  const response = await request.post(`${api}/api/tasks`, { data: { title } });
  expect(response.status()).toBe(201);
  const task = await response.json();
  try {
    expect(task).toMatchObject({ title, completed: false });
    const updated = await request.patch(`${api}/api/tasks/${task.id}`, { data: { completed: true } });
    expect(updated.status()).toBe(200);
    expect(await updated.json()).toMatchObject({ id: task.id, completed: true });
    const list = await request.get(`${api}/api/tasks`);
    expect(list.status()).toBe(200);
    expect(await list.json()).toContainEqual(expect.objectContaining({ id: task.id, completed: true }));
  } finally {
    const removed = await request.delete(`${api}/api/tasks/${task.id}`);
    expect(removed.status()).toBe(200);
  }
  const missing = await request.patch(`${api}/api/tasks/${task.id}`, { data: { completed: false } });
  expect(missing.status()).toBe(404);
});

test('API rejects an empty task title', async ({ request }) => {
  const response = await request.post(`${api}/api/tasks`, { data: { title: '  ' } });
  expect(response.status()).toBe(400);
  expect(await response.json()).toHaveProperty('error');
});
