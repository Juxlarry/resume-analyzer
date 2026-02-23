import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const defaults = {
  apiBaseUrl: 'http://localhost:3000/api/v1',
  apiAdminBaseUrl: 'http://localhost:3000/api/v1/admin',
  apiDocsUrl: 'http://localhost:3000/api-docs/v1/swagger.yaml',
  sidekiqUrl: 'http://localhost:3000/sidekiq',
};

function normalizeUrl(value, fallback) {
  const raw = (value || fallback).trim();

  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/\/+$/, '');
  }

  if (raw.startsWith('//')) {
    return `https:${raw}`.replace(/\/+$/, '');
  }

  return `https://${raw}`.replace(/\/+$/, '');
}

const appConfig = {
  apiBaseUrl: normalizeUrl(process.env.API_BASE_URL, defaults.apiBaseUrl),
  apiAdminBaseUrl: normalizeUrl(process.env.API_ADMIN_BASE_URL, defaults.apiAdminBaseUrl),
  apiDocsUrl: normalizeUrl(process.env.API_DOCS_URL, defaults.apiDocsUrl),
  sidekiqUrl: normalizeUrl(process.env.SIDEKIQ_URL, defaults.sidekiqUrl),
};

const targetFile = resolve('src/environments/environment.generated.ts');

const fileContents = `export interface AppConfig {
  apiBaseUrl: string;
  apiAdminBaseUrl: string;
  apiDocsUrl: string;
  sidekiqUrl: string;
}

export const environment: AppConfig = ${JSON.stringify(appConfig, null, 2)} as const;
`;

writeFileSync(targetFile, fileContents, 'utf8');
console.log(`Generated ${targetFile}`);
