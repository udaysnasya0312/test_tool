import type { ApiTestEntry } from '../../../core/types.js';
import { call } from './common.js';
// /contact-requests screen (read-only calls; /api/eet_ui/contact sends email and is not tested).
export const contactRoutes: ApiTestEntry[] = [
  call('contact requests - list', 'POST', '/api/eet_ui/contact-requests', {}, { status: 200 })
];
