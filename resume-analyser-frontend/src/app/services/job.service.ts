import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, interval, switchMap, takeWhile } from "rxjs";

export interface ResumeFile {
  filename: string; 
  size: number; 
  content_type: string; 
  url: string;
  download_url: string; 
  created_at: string;
}

export interface JobDescription {
  id: number;
  title: string;
  description: string;
  has_resume: boolean;
  created_at: string;
  resume_file?: ResumeFile;
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

  analyzeResume(jobId: number, resumeFile?: File | null): Observable<any> {
    const formData = new FormData();
    
    // Add resume file if provided
    if (resumeFile) {
      formData.append('resume', resumeFile);
    }
    
    return this.http.post(
      `${this.apiUrl}/job_descriptions/${jobId}/analyze`, 
      resumeFile ? formData : {}
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

  deleteJobDescription(jobId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/job_descriptions/${jobId}`
    );
  }

  deleteJob(jobId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/job_descriptions/${jobId}`);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  pollAnalysisStatus(jobId: number, intervalMs: number = 5000): Observable<AnalysisStatusResponse> {
    return interval(intervalMs).pipe(
      switchMap(() => this.getAnalysisStatus(jobId)),
      takeWhile(response => response.status === 'pending' || response.status === 'processing', true)
    );
  }
}
