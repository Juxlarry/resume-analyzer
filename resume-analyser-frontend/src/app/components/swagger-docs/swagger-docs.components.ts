import { Component, AfterViewInit } from '@angular/core';
import { APP_CONFIG } from '../../config/app-config';

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
      url: APP_CONFIG.apiDocsUrl,
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
