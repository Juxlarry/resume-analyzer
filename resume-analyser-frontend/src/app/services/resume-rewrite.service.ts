import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

export interface AdditionalProject {
  name: string;
  description: string;
  technologies?: string;
  duration?: string;
}

export interface CreateResumeRewritePayload {
  resume_rewrite: {
    accepted_suggestions: string[];
    additional_keywords: string[];
    additional_projects: AdditionalProject[];
    special_instructions?: string;
  };
}

export interface ResumeRewriteCreateResponse {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  status_url: string;
  estimated_wait_time?: string;
}

interface ResumeRewriteInputs {
  accepted_suggestions_count: number;
  additional_keywords_count: number;
  additional_projects_count: number;
  has_special_instructions: boolean;
}

export interface ResumeRewriteStatusResponse {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  inputs: ResumeRewriteInputs;
  estimated_wait_time?: string;
  result?: {
    improvements_summary: string;
    has_latex: boolean;
    has_pdf: boolean;
    download_urls: {
      latex: string;
      pdf: string;
    };
    latex_code: string;
    tokens_used: number;
    cost: number;
    ai_model: string;
  };
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResumeRewriteService {
  private apiUrl = APP_CONFIG.apiBaseUrl;

  constructor(private http: HttpClient) {}

  createRewrite(
    resumeAnalysisId: number,
    payload: CreateResumeRewritePayload
  ): Observable<ResumeRewriteCreateResponse> {
    return this.http.post<ResumeRewriteCreateResponse>(
      `${this.apiUrl}/resume_analyses/${resumeAnalysisId}/rewrites`,
      payload
    );
  }

  getRewriteStatus(rewriteId: number): Observable<ResumeRewriteStatusResponse> {
    return this.http.get<ResumeRewriteStatusResponse>(
      `${this.apiUrl}/resume_rewrites/${rewriteId}`
    );
  }

  downloadLatex(rewriteId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/resume_rewrites/${rewriteId}/download/latex`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  downloadPdf(rewriteId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/resume_rewrites/${rewriteId}/download/pdf`, {
      observe: 'response',
      responseType: 'blob'
    });
  }
}
