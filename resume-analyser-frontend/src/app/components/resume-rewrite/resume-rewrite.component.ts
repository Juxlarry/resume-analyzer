import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap, takeWhile } from 'rxjs/operators';
import { AlertService } from '../../services/alert.service';
import { JobDescription, JobService } from '../../services/job.service';
import {
  AdditionalProject,
  CreateResumeRewritePayload,
  ResumeRewriteService,
  ResumeRewriteStatusResponse
} from '../../services/resume-rewrite.service';

@Component({
  selector: 'app-resume-rewrite',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './resume-rewrite.component.html',
  styleUrls: ['./resume-rewrite.component.css']
})
export class ResumeRewriteComponent implements OnInit, OnDestroy {
  jobId = 0;
  jobDescription: JobDescription | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  availableSuggestions: string[] = [];
  selectedSuggestions: string[] = [];
  additionalKeywords: string[] = [];
  keywordInput = '';
  additionalProjects: AdditionalProject[] = [];
  newProject: AdditionalProject = this.emptyProject();
  specialInstructions = '';

  rewriteId: number | null = null;
  rewriteStatus: 'pending' | 'processing' | 'completed' | 'failed' | '' = '';
  latexCode = '';
  rewriteError = '';
  isSubmitting = false;
  isDownloading = false;
  hasPdfDownload = false;

  private pollingSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private jobService: JobService,
    private rewriteService: ResumeRewriteService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const routeJobId = Number(this.route.snapshot.params['id']);

    if (!Number.isFinite(routeJobId) || routeJobId <= 0) {
      this.errorMessage = 'Invalid job description id.';
      this.isLoading = false;
      return;
    }

    this.jobId = routeJobId;
    this.loadAnalysis();
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
  }

  loadAnalysis(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.jobService.getJobDescription(this.jobId).subscribe({
      next: (job) => {
        this.jobDescription = job;
        this.availableSuggestions = this.extractSuggestions(job.resume_analysis?.recommendations);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load analysis details.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleSuggestion(suggestion: string): void {
    const index = this.selectedSuggestions.indexOf(suggestion);

    if (index > -1) {
      this.selectedSuggestions.splice(index, 1);
      return;
    }

    this.selectedSuggestions.push(suggestion);
  }

  addKeyword(value: string): void {
    const keyword = value.trim();
    if (!keyword) return;

    const exists = this.additionalKeywords.some((existing) => existing.toLowerCase() === keyword.toLowerCase());
    if (exists) return;

    this.additionalKeywords.push(keyword);
    this.keywordInput = '';
  }

  removeKeyword(keyword: string): void {
    this.additionalKeywords = this.additionalKeywords.filter((item) => item !== keyword);
  }

  addProject(): void {
    const name = this.newProject.name?.trim() ?? '';
    const description = this.newProject.description?.trim() ?? '';

    if (!name || !description) {
      this.alertService.warning('Project name and description are required.');
      return;
    }

    this.additionalProjects.push({
      name,
      description,
      technologies: this.newProject.technologies?.trim() || undefined,
      duration: this.newProject.duration?.trim() || undefined
    });
    this.newProject = this.emptyProject();
  }

  removeProject(index: number): void {
    this.additionalProjects.splice(index, 1);
  }

  canSubmit(): boolean {
    return (
      !this.isSubmitting &&
      this.hasCompletedAnalysis() &&
      (
        this.selectedSuggestions.length > 0 ||
        this.additionalKeywords.length > 0 ||
        this.additionalProjects.length > 0 ||
        this.specialInstructions.trim().length > 0
      )
    );
  }

  submitRewrite(): void {
    if (!this.canSubmit()) return;

    const resumeAnalysisId = this.jobDescription?.resume_analysis?.id;
    if (!resumeAnalysisId) {
      this.alertService.error('Resume analysis is not available for rewrite.');
      return;
    }

    this.isSubmitting = true;
    this.rewriteError = '';

    const payload: CreateResumeRewritePayload = {
      resume_rewrite: {
        accepted_suggestions: this.selectedSuggestions,
        additional_keywords: this.additionalKeywords,
        additional_projects: this.additionalProjects,
        special_instructions: this.specialInstructions.trim() || undefined
      }
    };

    this.rewriteService.createRewrite(resumeAnalysisId, payload).subscribe({
      next: (response) => {
        this.rewriteId = response.id;
        this.rewriteStatus = response.status;
        this.isSubmitting = false;
        this.cdr.detectChanges();
        this.startPolling();
      },
      error: (error) => {
        this.isSubmitting = false;
        const apiError = error?.error?.error || error?.error?.errors?.join(', ') || 'Failed to start rewrite.';
        this.rewriteError = apiError;
        this.alertService.error(apiError);
      }
    });
  }

  downloadLatex(): void {
    this.downloadFile('latex');
  }

  downloadPdf(): void {
    this.downloadFile('pdf');
  }

  private downloadFile(format: 'latex' | 'pdf'): void {
    if (!this.rewriteId) return;

    this.isDownloading = true;
    const request = format === 'pdf'
      ? this.rewriteService.downloadPdf(this.rewriteId)
      : this.rewriteService.downloadLatex(this.rewriteId);

    request.subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.alertService.error('No file data was returned.');
          this.isDownloading = false;
          return;
        }

        const extension = format === 'pdf' ? 'pdf' : 'tex';
        const filename = this.extractFilename(response.headers.get('content-disposition')) || `resume_rewrite_${this.rewriteId}.${extension}`;
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(objectUrl);
        this.isDownloading = false;
      },
      error: (error) => {
        this.isDownloading = false;
        const fileType = format === 'pdf' ? 'PDF' : 'LaTeX';
        const apiError = error?.error?.error || `Failed to download ${fileType} file.`;
        this.alertService.error(apiError);
      }
    });
  }

  private startPolling(): void {
    if (!this.rewriteId) return;

    this.pollingSubscription?.unsubscribe();

    this.pollingSubscription = interval(3000)
      .pipe(
        startWith(0),
        switchMap(() => this.rewriteService.getRewriteStatus(this.rewriteId as number)),
        takeWhile((response) => response.status === 'pending' || response.status === 'processing', true)
      )
      .subscribe({
        next: (response: ResumeRewriteStatusResponse) => {
          this.rewriteStatus = response.status;

          if (response.status === 'completed') {
            this.latexCode = response.result?.latex_code ?? '';
            this.hasPdfDownload = response.result?.has_pdf ?? false;
            this.alertService.success('Resume rewrite completed.');
            this.cdr.detectChanges();
          } else if (response.status === 'failed') {
            this.rewriteError = response.error || 'Rewrite failed.';
            this.alertService.error(this.rewriteError);
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.rewriteError = 'Failed to poll rewrite status.';
          this.alertService.error(this.rewriteError);
          this.cdr.detectChanges();
        }
      });
  }

  private hasCompletedAnalysis(): boolean {
    return this.jobDescription?.resume_analysis?.status === 'completed';
  }

  private extractSuggestions(recommendationsHtml: string | undefined): string[] {
    if (!recommendationsHtml) return [];

    const parser = new DOMParser();
    const document = parser.parseFromString(recommendationsHtml, 'text/html');
    const items = Array.from(document.querySelectorAll('li'))
      .map((element) => element.textContent?.trim() || '')
      .filter((value) => value.length > 0);

    return Array.from(new Set(items));
  }

  private extractFilename(disposition: string | null): string | null {
    if (!disposition) return null;

    const match = disposition.match(/filename="?([^";]+)"?/i);
    return match?.[1] ?? null;
  }

  private emptyProject(): AdditionalProject {
    return {
      name: '',
      description: '',
      technologies: '',
      duration: ''
    };
  }
}
