import type { ApiTestEntry } from '../../../core/types.js';
import { call, step, asUser } from './common.js';
// Write tests for /contact-requests. New requests can't be made (POST /api/eet_ui/contact sends email) and none are deleted,
// so only an existing request's status is written back with its own value. The bad-input rows stop before any write.
const fakeId = 'TEST_DOES_NOT_EXIST';
const update = (name: string, body: unknown, message: string) =>
  call(name, 'PUT', `/api/eet_ui/contact-requests/${fakeId}`, body, { status: 400, message });
export const contactWriteRoutes: ApiTestEntry[] = [
  asUser('contact request - save status with its current value',
    step('read one request', 'POST', '/api/eet_ui/contact-requests', { page: '1', pageSize: '1' }, { status: 200 }, { requestId: 'data.0.id', requestStatus: 'data.0.status' }),
    step('save the same status', 'PUT', '/api/eet_ui/contact-requests/{{requestId}}', { status: '{{requestStatus}}' }, { status: 200, message: 'Contact request updated successfully.' }),
    step('status unchanged', 'POST', '/api/eet_ui/contact-requests', { page: '1', pageSize: '1' }, { data: [{ id: '{{requestId}}', status: '{{requestStatus}}' }] })),
  update('bad input - unknown status', { status: 'TEST_status' }, 'Please select a valid status.'),
  update('bad input - invalid email', { email: 'not-an-email' }, 'Please provide a valid email address.'),
  update('bad input - unknown subject', { subject: 'TEST_subject' }, 'Please select a valid subject.'),
  update('bad input - message too short', { message: 'short' }, 'Message must be between 10 and 5000 characters.'),
  update('bad input - no fields', {}, 'No valid fields provided for update.')
];
