import { Component, AfterViewInit } from '@angular/core';

// Declare BOTH globals from the scripts we added to angular.json
declare const SwaggerUIBundle: any;
declare const SwaggerUIStandalonePreset: any;

@Component({
  selector: 'app-swagger-docs',
  standalone: true,
  template: `<div id="swagger-ui"></div>`,
  styles: [`
    #swagger-ui { 
      padding: 20px; 
      background: white; 
      min-height: 100vh; 
    }
    /* Optional: Fix for Swagger's topbar sometimes being hidden in Angular */
    ::ng-deep .swagger-ui .topbar { display: block !important; }
  `]
})
export class SwaggerDocsComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    SwaggerUIBundle({
      url: 'http://localhost:3000/api-docs/v1/swagger.yaml',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIStandalonePreset // <--- Use the standalone preset variable here
      ],
      plugins: [
        SwaggerUIBundle.plugins.DownloadUrl
      ],
      layout: "StandaloneLayout",
    });
  }
}