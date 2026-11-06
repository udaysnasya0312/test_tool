import type { ApiTestEntry } from '../../../core/types.js';
import { asUser, call, missing, step } from './common.js';
// /profile and /user-management screens.
export const usersRoutes: ApiTestEntry[] = [
  asUser('profile - user details', step('profile - user details', 'POST', '/profile', { id: '{{userId}}' }, { status: 200 })),
  // "from" is a 1-based page number; 0 makes the route fail.
  call('user management - user list', 'POST', '/users/list', { search: '', from: 1, size: 5, role: '' }, { status: 200 }),
  call('bad input - user list without paging', 'POST', '/users/list', { search: '' }, missing('from', 'number'), 400)
];
