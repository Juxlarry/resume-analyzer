import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject, of } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import { Router } from "@angular/router";
import { APP_CONFIG } from "../config/app-config";

export interface User {
    id: number;
    email: string; 
    role: string; 
    created_at: string; 
    total_analyses: number; 
    completed_analyses: number;
    two_factor_enabled: boolean
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


export interface TwoFactorSetupResponse{
    secret: string;
    qr_code: string;
    provisioning_uri: string;
}

export interface TwoFactorStatusResponse{
    enabled: boolean; 
    has_backup_codes: boolean;
}

export interface TwoFactorEnableResponse{
    message: string; 
    backup_codes: string[];
}


@Injectable({
    providedIn: "root"
})
export class AuthService {
    private apiUrl = APP_CONFIG.apiBaseUrl;
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    private requires2FAsubject = new BehaviorSubject<boolean>(false); 
    public requires2FA$ = this.requires2FAsubject.asObservable();

    constructor(
        private http: HttpClient,
        private router: Router
    ){}

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
            user: { email, password }
        }).pipe(
            tap(response => {
                //check 2FA required
                if ((response as any).requires_otp){
                    this.requires2FAsubject.next(true);
                }else {
                    this.setToken(response.token);
                    this.isAuthenticatedSubject.next(true);
                    this.loadCurrentUser();
                }
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

    verifyOtp(code: string, otp_user_id: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login/verify_otp`, {
            code, 
            otp_user_id
        }).pipe (
            tap(response => {
                this.setToken(response.token); 
                this.isAuthenticatedSubject.next(true); 
                this.requires2FAsubject.next(false); 
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

    forgotPassword(email: string): Observable<any> {
        console.log(`User Email to submit forgot password details: ${email}`)
        return this.http.post(`${this.apiUrl}/password`, {
            user: { email }
        });
    }

    resetPassword(resetPasswordToken: string, password: string, passwordConfirmation: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/password`, {
            user: {
                reset_password_token: resetPasswordToken, 
                password, 
                password_conformation: passwordConfirmation
            }
        });
    }

    getTwoFactorSetup(): Observable<TwoFactorSetupResponse> {
        return this.http.get<TwoFactorSetupResponse>(`${this.apiUrl}/two_factor/setup`);
    }

    enableTwoFactor(code: string): Observable<TwoFactorEnableResponse> {
        return this.http.post<TwoFactorEnableResponse>(`${this.apiUrl}/two_factor/enable`, {
            code
        });
    }

    disableTwoFactor(code: string): Observable<any>{
        return this.http.request('delete', `${this.apiUrl}/two_factor/disable`, {
            body: { code }
        });
    }

    getTwoFactorStatus(): Observable<TwoFactorStatusResponse>{
        return this.http.get<TwoFactorStatusResponse>(`${this.apiUrl}/two_factor/status`);
    }

    regenerateBackupCodes(code: string): Observable<TwoFactorEnableResponse>{
        return this.http.post<TwoFactorEnableResponse>(`${this.apiUrl}/two_factor/regenerate_backup_codes`, {
            code
        });
    }

    private performLogout(redirectTo: string = '/'): void {
        this.clearToken();
        this.isAuthenticatedSubject.next(false);
        this.currentUserSubject.next(null);
        this.requires2FAsubject.next(false);
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


    validateToken(): Observable<boolean> {
        const token = this.getToken();

        if (!token) {
            this.isAuthenticatedSubject.next(false);
            this.currentUserSubject.next(null);
            return of(false);
        }

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
