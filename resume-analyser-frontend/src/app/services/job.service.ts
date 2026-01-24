import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, interval, switchMap, takeWhile } from "rxjs";


export interface JobDescription {
    id?: number;
    title: string;
    description: string;
    resume_file?: File;
    resume_analysis?: ResumeAnalysis;
}

export interface ResumeAnalysis {
    id: number;
    summary: string;
    strengths: string;
    weaknesses: string;
    recommendations: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    created_at: string;
}

@Injectable({
    providedIn: "root",
})
export class JobService {
    private apiUrl = "http://localhost:3000/api/v1";

    constructor(private http: HttpClient) {}

    createJobDescription(jobData: FormData): Observable<JobDescription> {
        return this.http.post<JobDescription>(`${this.apiUrl}/job_descriptions`, jobData);
    }

    analyzeResume(jobId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/job_descriptions/${jobId}/analyze`, {}
        );
    }

    getAnalysisStatus(jobId: number): Observable<{status: string, analysis?: ResumeAnalysis}> {
    return this.http.get<{status: string, analysis?: ResumeAnalysis}>(
      `${this.apiUrl}/job_descriptions/${jobId}/analysis_status`
    );
  }

  pollAnalysisStatus(jobId: number, intervalMs = 5000): Observable<ResumeAnalysis> {
    return interval(intervalMs).pipe(
      switchMap(() => this.getAnalysisStatus(jobId)),
      takeWhile(response => 
        response.status === 'pending' || response.status === 'processing', 
        true // include the last emission
      ),
      switchMap(response => {
        if (response.status === 'completed' && response.analysis) {
          return [response.analysis];
        }
        return [];
      })
    );
  }

  getJobDescriptions(): Observable<JobDescription[]> {
    return this.http.get<JobDescription[]>(`${this.apiUrl}/job_descriptions`);
  }
}
