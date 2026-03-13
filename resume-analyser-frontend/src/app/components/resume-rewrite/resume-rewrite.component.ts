import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap, takeWhile } from 'rxjs/operators';
import { AlertService } from '../../services/alert.service';
import { JobDescription, JobService } from '../../services/job.service';
import {
  AdditionalProject,
  CreateResumeRewritePayload,
  ResumeRewriteListItem,
  ResumeRewriteService,
  ResumeRewriteStatusResponse
} from '../../services/resume-rewrite.service';

@Component({
  selector: 'app-resume-rewrite',
  standalone: true,
  imports: [FormsModule, RouterLink],
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
  hasDocxDownload = false;

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
      this.cdr.detectChanges();
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
        this.restoreLatestRewrite();
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
    } else {
      this.selectedSuggestions.push(suggestion);
    }
  }

  isSuggestionSelected(suggestion: string): boolean {
    return this.selectedSuggestions.includes(suggestion);
  }

  addKeyword(value: string): void {
    const keyword = value.trim();
    if (!keyword) return;
    const exists = this.additionalKeywords.some(k => k.toLowerCase() === keyword.toLowerCase());
    if (exists) return;
    this.additionalKeywords.push(keyword);
    this.keywordInput = '';
  }

  removeKeyword(keyword: string): void {
    this.additionalKeywords = this.additionalKeywords.filter(k => k !== keyword);
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
      duration:     this.newProject.duration?.trim()     || undefined
    });
    this.newProject = this.emptyProject();
  }

  removeProject(index: number): void {
    this.additionalProjects.splice(index, 1);
  }

  canSubmit(): boolean {
    return (
      !this.isSubmitting &&
      this.jobDescription?.resume_analysis?.status === 'completed' &&
      (
        this.selectedSuggestions.length   > 0 ||
        this.additionalKeywords.length    > 0 ||
        this.additionalProjects.length    > 0 ||
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
        accepted_suggestions:  this.selectedSuggestions,
        additional_keywords:   this.additionalKeywords,
        additional_projects:   this.additionalProjects,
        special_instructions:  this.specialInstructions.trim() || undefined
      }
    };

    this.rewriteService.createRewrite(resumeAnalysisId, payload).subscribe({
      next: (response) => {
        this.rewriteId      = response.id;
        this.rewriteStatus  = response.status;
        this.isSubmitting   = false;
        this.hasPdfDownload  = false;
        this.hasDocxDownload = false;
        this.latexCode      = '';
        this.rewriteError   = '';
        this.cdr.detectChanges();
        this.startPolling(true);
      },
      error: (error) => {
        this.isSubmitting = false;
        const apiError = error?.error?.error || error?.error?.errors?.join(', ') || 'Failed to start rewrite.';
        this.rewriteError = apiError;
        this.alertService.error(apiError);
        this.cdr.detectChanges();
      }
    });
  }

  downloadLatex(): void { this.downloadFile('latex'); }
  downloadPdf():   void { this.downloadFile('pdf');   }
  downloadDocx():  void { this.downloadFile('docx');  }

  private downloadFile(format: 'latex' | 'pdf' | 'docx'): void {
    if (!this.rewriteId) return;
    this.isDownloading = true;

    const request = format === 'pdf'
      ? this.rewriteService.downloadPdf(this.rewriteId)
      : format === 'docx'
        ? this.rewriteService.downloadDocx(this.rewriteId)
        : this.rewriteService.downloadLatex(this.rewriteId);

    request.subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.alertService.error('No file data was returned.');
          this.isDownloading = false;
          this.cdr.detectChanges();
          return;
        }
        const ext      = format === 'pdf' ? 'pdf' : format === 'docx' ? 'docx' : 'tex';
        const filename = this.extractFilename(response.headers.get('content-disposition'))
                         || `resume_rewrite_${this.rewriteId}.${ext}`;
        const url  = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isDownloading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isDownloading = false;
        const label    = format === 'pdf' ? 'PDF' : format === 'docx' ? 'DOCX' : 'LaTeX';
        const apiError = error?.error?.error || `Failed to download ${label} file.`;
        this.alertService.error(apiError);
        this.cdr.detectChanges();
      }
    });
  }

  private startPolling(notifyOnCompletion = true): void {
    if (!this.rewriteId) return;
    this.pollingSubscription?.unsubscribe();

    this.pollingSubscription = interval(3000)
      .pipe(
        startWith(0),
        switchMap(() => this.rewriteService.getRewriteStatus(this.rewriteId as number)),
        takeWhile(r => r.status === 'pending' || r.status === 'processing', true)
      )
      .subscribe({
        next:  (r) => this.applyRewriteStatus(r, notifyOnCompletion),
        error: ()  => {
          this.rewriteError = 'Failed to poll rewrite status.';
          this.alertService.error(this.rewriteError);
          this.cdr.detectChanges();
        }
      });
  }

  private restoreLatestRewrite(): void {
    const analysisId = this.jobDescription?.resume_analysis?.id;
    if (!analysisId || this.jobDescription?.resume_analysis?.status !== 'completed') return;

    this.rewriteService.listRewrites(analysisId).subscribe({
      next: (rewrites: ResumeRewriteListItem[]) => {
        if (!rewrites.length) return;
        const latest = rewrites[0];
        this.rewriteId     = latest.id;
        this.rewriteStatus = latest.status;
        this.cdr.detectChanges();

        if (latest.status === 'pending' || latest.status === 'processing') {
          this.startPolling(false);
          return;
        }
        this.loadRewriteStatus(latest.id);
      },
      error: () => {}
    });
  }

  private loadRewriteStatus(id: number): void {
    this.rewriteService.getRewriteStatus(id).subscribe({
      next:  (r) => this.applyRewriteStatus(r, false),
      error: () => {}
    });
  }

  private applyRewriteStatus(r: ResumeRewriteStatusResponse, notify: boolean): void {
    this.rewriteStatus = r.status;
    if (r.status === 'completed') {
      this.latexCode    = r.result?.latex_code ?? '';
      this.hasPdfDownload  = r.result?.has_pdf  ?? false;
      this.hasDocxDownload = r.result?.has_docx ?? false;
      this.rewriteError = '';
      if (notify) this.alertService.success('Resume rewrite completed.');
    } else if (r.status === 'failed') {
      this.rewriteError = r.error || 'Rewrite failed.';
      this.alertService.error(this.rewriteError);
    }
    this.cdr.detectChanges();
  }

  private extractSuggestions(html: string | undefined): string[] {
    if (!html) return [];
    const doc   = new DOMParser().parseFromString(html, 'text/html');
    const items = Array.from(doc.querySelectorAll('li'))
      .map(el => el.textContent?.trim() || '')
      .filter(v => v.length > 0);
    return Array.from(new Set(items));
  }

  private extractFilename(disposition: string | null): string | null {
    if (!disposition) return null;
    return disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? null;
  }

  private emptyProject(): AdditionalProject {
    return { name: '', description: '', technologies: '', duration: '' };
  }
}