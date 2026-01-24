import { Injectable } from "@angular/core";
import {
    HttpEvent,
    HttpInterceptor,
    HttpHandler,
    HttpRequest, 
    HttpErrorResponse
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { AuthService } from "../services/auth.service";
import { catchError } from "rxjs/operators";
import { Router } from "@angular/router";


@Injectable()
export class AuthInterceptor implements HttpInterceptor{
    constructor(
        private authService: AuthService,
        private router: Router
    ){}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.authService.getToken();

        if(token){
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }

        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                if(error.status === 410){
                    this.authService.logout();
                    this.router.navigate(['/login']);
                }else if (error.status === 429) {
                    alert("Rate limit exceeded: Too many requests. Please try again later.");
                }
                return throwError(() => error);
            })
        );
    }   
}