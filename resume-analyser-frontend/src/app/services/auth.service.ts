import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, BehaviorSubject } from "rxjs";
import { tap } from "rxjs/operators";
import { Router } from "@angular/router";


export interface AuthResponse {
    user: {
        id: number;
        email: string;
        created_at: string;
        updated_at: string;
    };
    token: string;
    message: string;
}

@Injectable({
    providedIn: "root"
})
export class AuthService {
    private apiUrl = "http://localhost:3000/api/v1"; // Adjust the URL as needed
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    constructor(
        private http: HttpClient,
        private router: Router
    ){}

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
            user: { email, password }
        }).pipe(
            tap(response => {
                this.setToken(response.token);
                this.isAuthenticatedSubject.next(true);
            })
      ); 
    }

    register(email: string, password: string, passwordConfirmation: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(
            `${this.apiUrl}/signup`, {
                user: {email, password, passwordConfirmation: passwordConfirmation }
            }).pipe(
                tap(response => {
                this.setToken(response.token);
                this.isAuthenticatedSubject.next(true);
            })
        );
    }


    logout(): void {
        this.http.delete(`${this.apiUrl}/logout`).subscribe(() => {
            this.clearToken();
            this.isAuthenticatedSubject.next(false);
            this.router.navigate(['/login']);
        });
    }

    getToken(): string | null {
        return localStorage.getItem("auth_token");
    }

    private setToken(token: string): void {
        localStorage.setItem("auth_token", token);
    }

    private clearToken(): void {
        localStorage.removeItem("auth_token");
    }

    private hasToken(): boolean {
        return !!this.getToken();
    }
}