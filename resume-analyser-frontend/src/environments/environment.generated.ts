export interface AppConfig {
  apiBaseUrl: string;
  apiAdminBaseUrl: string;
  apiDocsUrl: string;
  sidekiqUrl: string;
}

export const environment: AppConfig = {
  "apiBaseUrl": "https://resume-analyser-api-production.up.railway.app/api/v1",
  "apiAdminBaseUrl": "https://resume-analyser-api-production.up.railway.app/api/v1/admin",
  "apiDocsUrl": "https://resume-analyser-api-production.up.railway.app/api-docs/v1/swagger.yaml",
  "sidekiqUrl": "https://resume-analyser-api-production.up.railway.app/sidekiq"
} as const;
