import type { AppConfig } from '../../core/types.js';
export const appConfig: AppConfig = {
  name: 'eet',
  baseUrl: process.env.EET_BASE_URL || '',
  apiBaseUrl: process.env.EET_API_BASE_URL || '',
  healthCheckUrl: process.env.EET_HEALTH_CHECK_URL || '',
  // Logged in once before the tests; screen tests start from this saved session.
  auth: {
    method: 'form', loginPath: '/app/eetUi/login', username: process.env.EET_USERNAME || '', password: process.env.EET_PASSWORD || '',
    usernameSelector: 'input[placeholder="E-mail"]', passwordSelector: 'input[placeholder="Password"]', submitSelector: 'form button:has-text("Login")'
  },
  timeouts: { test: 60000, expect: 15000, action: 15000 }
};
