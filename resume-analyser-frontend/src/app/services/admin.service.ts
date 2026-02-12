import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

    // getStats() {
    //     return this.http.get<any>(`${this.apiUrl}/dashboard/stats`);
    // }

    getUsers(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/users`);
    }

    updateUserRole(userId: number, role: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/users/${userId}`, { user: { role } });
    }

    deleteUser(userId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/users/${userId}`);
    }

    getJobs(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/jobs`);
    }

    deleteJob(jobId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/jobs/${jobId}`);
    }
}