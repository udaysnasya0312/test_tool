import type { ApiTestEntry } from '../../../core/types.js';
import { call, missing } from './common.js';
// Only cases that stop before the OTP email is sent (server/routes/main_dashboard/index.ts /signup, /verifyotp).
const username = process.env.EET_USERNAME || '';
export const signupRoutes: ApiTestEntry[] = [
  call('signup - already registered email', 'POST', '/signup', { email: username, password: 'any-password' }, { status: 400, message: 'User Already Exists!' }),
  call('signup - missing password', 'POST', '/signup', { email: 'no-such-user@example.com' }, missing('password', 'string'), 400),
  call('verify otp - wrong otp creates nothing', 'POST', '/verifyotp', { email: 'no-such-user@example.com', otp: '000000', password: 'any-password', firstname: 'Test', lastname: 'User' }, { status: 400, message: 'Entered Wrong OTP!' }),
  call('verify otp - missing otp', 'POST', '/verifyotp', { email: 'no-such-user@example.com', password: 'any-password', firstname: 'Test', lastname: 'User' }, missing('otp', 'string'), 400)
];
