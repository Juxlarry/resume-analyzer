import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, interval, switchMap, takeWhile } from "rxjs";


export interface JobDescription {
  id: number;
  title: string;
  description: string;
  has_resume: boolean;
  created_at: string;
  resume_analysis?: ResumeAnalysis;
}

export interface ResumeAnalysis {
  id: number;
  match_score: number;
  verdict: string;
  summary: string;
  strengths: string;
  weaknesses: string;
  recommendations: string;
  missing_keywords: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_model_used: string;
  created_at: string;
  updated_at: string;
}

export interface AnalysisStatusResponse {
  status: 'not_started' | 'pending' | 'processing' | 'completed' | 'failed';
  estimated_wait_time?: string;
  analysis?: ResumeAnalysis;
  error?: string;
  message?: string;
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
    return this.http.post(
      `${this.apiUrl}/job_descriptions/${jobId}/analyze`, 
      {}
    );
  }

  getAnalysisStatus(jobId: number): Observable<AnalysisStatusResponse> {
    return this.http.get<AnalysisStatusResponse>(
      `${this.apiUrl}/job_descriptions/${jobId}/analysis_status`
    );
  }

  getJobDescriptions(): Observable<JobDescription[]> {
    return this.http.get<JobDescription[]>(`${this.apiUrl}/job_descriptions`);
  }

  getJobDescription(jobId: number): Observable<JobDescription> {
    return this.http.get<JobDescription>(
        `${this.apiUrl}/job_descriptions/${jobId}`
    );
  }
}
