import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

   // Skip adding token for login/signup endpoints
  const isAuthEndpoint = req.url.includes('/login') || req.url.includes('/signup');

  // Clone request and add auth header if token exists
  const authReq = token && !isAuthEndpoint
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  // Handle the request and catch errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        // Unauthorized - redirect to login
        console.error('Authentication error - token invalid or expired');

        localStorage.removeItem('auth_token');

        const currentUrl = router.url;
        if (!currentUrl.includes('/login') && 
            !currentUrl.includes('/signup') && 
            !currentUrl.includes('/welcome')) {
          router.navigate(['/login'], { 
            queryParams: { returnUrl: currentUrl }
          });
        }
      } else if (error.status === 429) {
        // Rate limit exceeded
        alert('Rate limit exceeded: Too many requests. Please try again later.');
      }
      return throwError(() => error);
    })
  );
};