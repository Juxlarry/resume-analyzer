import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
    id: number;
    email: string; 
    role: string; 
    created_at: string; 
    // total_analyses: number; 
    // completed_analyses: number; 
}

export interface Stats {
    total_users: number;
    total_analyses: number;
    today_analyses: number;
    avg_match_score: number;
    success_rate: number;
}

export interface UpdateProfileData {
    email?: string;
    password?: string; 
    password_confirmation?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private apiUrl = "http://localhost:3000/api/v1/admin";

    constructor(private http: HttpClient) {}

    getDashboardStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/dashboard/stats`);
    }

    getUsers(page: number = 1, perPage: number = 20, search: string = '' ): Observable<any> {
        let params = new HttpParams()
        .set('page', page.toString())
        .set('per_page', perPage.toString());

        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<any>(`${this.apiUrl}/users`, { params });
    }

    updateUserRole(userId: number, role: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/users/${userId}`, { user: { role } });
    }

    deleteUser(userId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/users/${userId}`);
    }

    exportUsers(search: string = ''): Observable<Blob> {
        let params = new HttpParams();
        if (search) {
            params = params.set('search', search);
        }
        
        return this.http.get(`${this.apiUrl}/users/export`, {
            params,
            responseType: 'blob'
        });
    }

    getJobs(status: string = 'all'): Observable<any[]> {
        let params = new HttpParams();
        if (status !== 'all'){
            params = params.set('status', status);
        }

        return this.http.get<any[]>(`${this.apiUrl}/jobs`, { params });
    }

    deleteJob(jobId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/jobs/${jobId}`);
    }

    exportJobs(): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/jobs/export`, {
            responseType: 'blob'
        });
    }

    // Activity Logs
    getActivityLogs(page: number = 1, perPage: number = 50, action: string = 'all'): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('per_page', perPage.toString());
        
        if (action !== 'all') {
            params = params.set('action', action);
        }
        
        return this.http.get<any>(`${this.apiUrl}/activity_logs`, { params });
    }

    getActivityLogStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/activity_logs/stats`);
    }
}