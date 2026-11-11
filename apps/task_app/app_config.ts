export const appConfig = {
  name: 'task_app',
  baseUrl: process.env.TASK_APP_BASE_URL!,
  apiBaseUrl: process.env.TASK_APP_API_BASE_URL || process.env.TASK_APP_BASE_URL!,
  auth: { method: 'none' as const }
};
