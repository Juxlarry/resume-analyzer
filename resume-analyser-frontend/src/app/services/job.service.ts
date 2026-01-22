import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";


export interface JobDescription {
    id?: number;
    title: string;
    description: string;
    resume_file?: File;
}

export interface ResumeAnalysis {
    id: number;
    summary: string;
    strengths: string;
    weaknesses: string;
    recommendations: string;
    created_at: string;
}

@Injectable({
    providedIn: "root",
})
export class JobService {
    private apiUrl = "http://localhost:3000/api/v1";

    constructor(private http: HttpClient) {}

    createJobDescription(jobData: FormData): Observable<any> {
        return this.http.post(`${this.apiUrl}/job_descriptions`, jobData);
    }

    analyzeResume(jobId: number): Observable<ResumeAnalysis> {
        return this.http.post<ResumeAnalysis>(`${this.apiUrl}/job_descriptions/${jobId}/analyze`, {}
        );
    }
}
