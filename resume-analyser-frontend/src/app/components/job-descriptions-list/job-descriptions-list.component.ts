import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { JobService, JobDescription } from '../../services/job.service';
import { RerunAnalysisModal } from '../rerun-analysis-modal/rerun-analysis-modal.component';
import { AlertService } from '../../services/alert.service';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-job-descriptions-list',
  standalone: true,
  imports: [RouterLink, RerunAnalysisModal, ConfirmationModalComponent],
  templateUrl: './job-descriptions-list.component.html',
  styleUrls: ['./job-descriptions-list.component.css']
})
export class JobDescriptionListComponent implements OnInit {
  jobDescriptions: JobDescription[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  isAdmin = false;

  isRerunModalOpen = false;
  selectedJobForRerun: JobDescription | null = null;
  isDeleteConfirmOpen = false;
  jobToDelete: JobDescription | null = null;

  constructor(
    private jobService: JobService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadJobDescriptions();
    this.authService.currentUser$.subscribe(user => {
      this.isAdmin = user?.role === 'admin';
    });
  }

  loadJobDescriptions(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.jobService.getJobDescriptions().subscribe({
      next: (data) => {
        this.jobDescriptions = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.alertService.error('Failed to load analyses. Please try again.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewJobDescription(jobId: number): void {
    this.router.navigate(['/job-descriptions', jobId]);
  }

  openRerunModal(job: JobDescription): void {
    this.selectedJobForRerun = job;
    this.isRerunModalOpen = true;
  }

  closeRerunModal(): void {
    this.isRerunModalOpen = false;
    this.selectedJobForRerun = null;
  }

  confirmRerun(newResumeFile: File | null): void {
    if (!this.selectedJobForRerun) return;
    const jobId = this.selectedJobForRerun.id;
    this.jobService.analyzeResume(jobId, newResumeFile).subscribe({
      next: () => {
        const msg = newResumeFile
          ? 'Analysis restarted with new resume.'
          : 'Analysis restarted with existing resume.';
        this.alertService.success(msg);
        this.closeRerunModal();
        this.router.navigate(['/job-descriptions', jobId]);
      },
      error: () => {
        this.alertService.error('Failed to restart analysis. Please try again.');
        this.closeRerunModal();
      }
    });
  }

  openDeleteConfirmation(job: JobDescription): void {
    this.jobToDelete = job;
    this.isDeleteConfirmOpen = true;
  }

  closeDeleteConfirmation(): void {
    this.isDeleteConfirmOpen = false;
    this.jobToDelete = null;
  }

  confirmDelete(): void {
    if (!this.jobToDelete) return;
    this.jobService.deleteJobDescription(this.jobToDelete.id).subscribe({
      next: () => {
        this.jobDescriptions = this.jobDescriptions.filter(j => j.id !== this.jobToDelete!.id);
        this.alertService.success('Analysis deleted.');
        this.closeDeleteConfirmation();
      },
      error: () => {
        this.alertService.error('Failed to delete. Please try again.');
        this.closeDeleteConfirmation();
      }
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      completed:  'bg-hirivo-green-bg text-hirivo-green',
      processing: 'bg-hirivo-teal-light text-hirivo-teal',
      pending:    'bg-hirivo-amber-bg text-hirivo-amber',
      failed:     'bg-hirivo-red-bg text-hirivo-red'
    };
    return map[status] || 'bg-hirivo-surface text-hirivo-muted';
  }

  getScoreClass(score: number): string {
    if (score >= 70) return 'text-hirivo-green';
    if (score >= 50) return 'text-hirivo-amber';
    return 'text-hirivo-red';
  }

  getScoreBg(score: number): string {
    if (score >= 70) return 'bg-hirivo-green-bg';
    if (score >= 50) return 'bg-hirivo-amber-bg';
    return 'bg-hirivo-red-bg';
  }

  formatVerdict(verdict: string): string {
    return verdict?.replace(/_/g, ' ') ?? '';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
}