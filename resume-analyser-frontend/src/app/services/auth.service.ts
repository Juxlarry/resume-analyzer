import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject, of } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import { Router } from "@angular/router";

export interface User {
    id: number;
    email: string; 
    role: string; 
    created_at: string; 
    total_analyses: number; 
    completed_analyses: number;
}

export interface UpdateProfileData {
    email?: string;
    password?: string; 
    password_confirmation?: string;
}

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
    private apiUrl = "http://localhost:3000/api/v1"; 
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(
        private http: HttpClient,
        private router: Router
    ){
        // if (this.hasToken()) {
            // this.validateToken().subscribe();
            // this.loadCurrentUser();

        // }
    }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
            user: { email, password }
        }).pipe(
            tap(response => {
                this.setToken(response.token);
                this.isAuthenticatedSubject.next(true);
                this.loadCurrentUser();
            })
      ); 
    }

    register(email: string, password: string, passwordConfirmation: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(
            `${this.apiUrl}/signup`, {
                user: {
                    email, 
                    password, 
                    password_confirmation: passwordConfirmation  
                }
            }
        ).pipe(
                tap(response => {
                this.setToken(response.token);
                this.isAuthenticatedSubject.next(true);
                this.loadCurrentUser();
            })
        );
    }


    logout(): void {
        this.http.delete(`${this.apiUrl}/logout`).subscribe({
            next: () => {
                this.performLogout();
            },
            error: (error) => {
                console.error('Logout API failed: ', error);
                this.performLogout('/');
            }
        });
    }

    silentLogout(): void {
        this.performLogout('/login');
    }

    private performLogout(redirectTo: string = '/'): void {
        this.clearToken();
        this.isAuthenticatedSubject.next(false);
        this.currentUserSubject.next(null);
        this.router.navigate([redirectTo]);
    }

    getToken(): string | null {
        return localStorage.getItem("auth_token");
    }

    getProfile(): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/profile`);
    }

    updateProfile(data: UpdateProfileData): Observable<any> {
        return this.http.put(`${this.apiUrl}/profile`, { user: data }).pipe(
            tap(() => {
                this.loadCurrentUser()
            })
        );
    }


    isTokenExpiringSoon(): boolean {
        const token = this.getToken();
        if (!token) return true;
        
        try {
            // Decode JWT token (basic parsing - for production use a library like jwt-decode)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            const timeUntilExpiration = expirationTime - currentTime;
            
            // Return true if expiring within 5 minutes
            return timeUntilExpiration < 5 * 60 * 1000;
        } catch (error) {
            console.error('Error parsing token:', error);
            return true;
        }
    }

    // Add this method to validate token on app load
    validateToken(): Observable<boolean> {
        const token = this.getToken();

        if (!token) {
            this.isAuthenticatedSubject.next(false);
            this.currentUserSubject.next(null);
            return of(false);
        }

        // Try to load profile to validate token
        return this.getProfile().pipe(
            map((user) => {
                    this.isAuthenticatedSubject.next(true);
                    this.currentUserSubject.next(user);
                    return true;
                }),
                catchError((error) => {
                    console.error('Token validation failed:', error);

                    if(error.status === 401) {
                        this.clearToken();
                        this.isAuthenticatedSubject.next(false);
                        this.currentUserSubject.next(null);
                    }

                    return of(false);
                }
            )
        );
    }


    private loadCurrentUser(): void {
        this.getProfile().subscribe({
            next: (user) => {
                this.currentUserSubject.next(user);
                this.isAuthenticatedSubject.next(true);
            },
            error: (error) => {
                console.error('Failed to load user profile:', error);
                // If profile load fails, user might not be authenticated
                if (error.status === 401) {
                    this.clearToken();
                    this.isAuthenticatedSubject.next(false);
                    this.currentUserSubject.next(null);
                }
            }
        });
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