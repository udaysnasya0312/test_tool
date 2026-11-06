export type ReportMode = 'api' | 'ui' | 'e2e';
export const reportModes: ReportMode[];
export function reportDirectory(app: string, mode?: string): string;
