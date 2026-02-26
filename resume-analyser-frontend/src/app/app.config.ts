import { ApplicationConfig, provideZonelessChangeDetection, provideBrowserGlobalErrorListeners, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';    
import { AuthService } from './services/auth.service';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';


// Token validation function
function initializeApp() {

  const authService = inject(AuthService);

  // Only validate if token exists
  if (authService.getToken()) {
    return firstValueFrom(authService.validateToken());
  }
  return Promise.resolve(true);

}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])), 
    provideAppInitializer(initializeApp)
  ]
};
