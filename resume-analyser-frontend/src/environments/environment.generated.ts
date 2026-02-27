export interface AppConfig {
  apiBaseUrl: string;
  apiAdminBaseUrl: string;
  apiDocsUrl: string;
  sidekiqUrl: string;
}

export const environment: AppConfig = {
  "apiBaseUrl": "http://localhost:3000/api/v1",
  "apiAdminBaseUrl": "http://localhost:3000/api/v1/admin",
  "apiDocsUrl": "http://localhost:3000/api-docs/v1/swagger.yaml",
  "sidekiqUrl": "http://localhost:3000/sidekiq"
} as const;
