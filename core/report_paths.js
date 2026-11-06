import path from 'node:path';

export const reportModes = ['api', 'ui', 'e2e'];

export function reportDirectory(app, mode = process.env.TEST_MODE) {
  if (!app || !/^[a-zA-Z0-9_-]+$/.test(app)) throw new Error('A valid application folder name is required');
  if (!reportModes.includes(mode)) throw new Error('Select one report mode: api, ui or e2e');
  return path.resolve('reports', `${mode}_report`, app);
}
