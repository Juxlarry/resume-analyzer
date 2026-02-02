import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JobService, JobDescription, AnalysisStatusResponse } from '../../services/job.service';
import { RerunAnalysisModal } from '../rerun-analysis-modal/rerun-analysis-modal.component';
import { Subscription, interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { ConfirmationModal } from '../confirmation-modal/confirmation-modal.component';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-job-description-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    RerunAnalysisModal, 
    ConfirmationModal
  ],
  templateUrl: './job-description-detail.component.html',
  styleUrls: ['./job-description-detail.component.css']
})
export class JobDescriptionDetailComponent implements OnInit, OnDestroy {
  jobDescription: JobDescription | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  isPolling = false;
  private pollingSubscription?: Subscription;

  // Modal state
  isRerunModalOpen = false;
  isDeleteConfirmOpen = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobService: JobService, 
    private cdr: ChangeDetectorRef, 
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const jobId = this.route.snapshot.params['id'];
    if (jobId) {
      this.loadJobDescription(+jobId);
    }
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
  }

  loadJobDescription(jobId: number): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.jobService.getJobDescription(jobId).subscribe({
      next: (data) => {
        this.jobDescription = data;
        this.isLoading = false;
        this.cdr.detectChanges();

        // Start polling if processing
        if (data.resume_analysis?.status === 'processing' || 
            data.resume_analysis?.status === 'pending') {
          this.startPolling(jobId);
        }
      },
      error: (error) => {
        console.error('Error loading job description:', error);
        this.errorMessage = 'Failed to load analysis details. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  startPolling(jobId: number): void {
    this.isPolling = true;
    let pollCount = 0;
    const maxPolls = 60; // 5 minutes at 5-second intervals

    this.pollingSubscription = interval(5000)
      .pipe(
        switchMap(() => this.jobService.getAnalysisStatus(jobId)),
        takeWhile(response => {
          pollCount++;
          if (pollCount >= maxPolls) {
            this.errorMessage = "Analysis is taking longer than expected.";
            return false;
          }
          return response.status === 'pending' || response.status === 'processing';
        }, true)
      )
      .subscribe({
        next: (response: AnalysisStatusResponse) => {
          if (response.status === 'completed' && this.jobDescription && response.analysis) {
            this.jobDescription.resume_analysis = response.analysis;
            this.isPolling = false;
            this.pollingSubscription?.unsubscribe();
            this.cdr.detectChanges();
          } else if (response.status === 'failed') {
            this.errorMessage = response.error || "Analysis failed";
            this.isPolling = false;
            this.pollingSubscription?.unsubscribe();
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Polling error:', error);
          this.isPolling = false;
          this.pollingSubscription?.unsubscribe();
          this.cdr.detectChanges();
        }
      });
  }

  openRerunModal(): void {
    this.isRerunModalOpen = true;
  }

  closeRerunModal(): void {
    this.isRerunModalOpen = false;
  }

  confirmRerun(newResumeFile: File | null): void {
    if (!this.jobDescription) return;

    this.jobService.analyzeResume(this.jobDescription.id, newResumeFile).subscribe({
      next: (response) => {
        const message = newResumeFile 
          ? 'Analysis restarted with new resume!'
          : 'Analysis restarted with existing resume!';
        alert(message);
        this.closeRerunModal();
        this.loadJobDescription(this.jobDescription!.id);
      },
      error: (error) => {
        console.error('Error re-running analysis:', error);
        alert('Failed to restart analysis. Please try again.');
        this.closeRerunModal();
      }
    });
  }

  reRunAnalysis(): void {
    if (!this.jobDescription || !confirm('Are you sure you want to re-run this analysis?')) {
      return;
    }

    this.jobService.analyzeResume(this.jobDescription.id).subscribe({
      next: (response) => {
        alert('Analysis restarted!');
        this.loadJobDescription(this.jobDescription!.id);
      },
      error: (error) => {
        console.error('Error re-running analysis:', error);
        alert('Failed to restart analysis. Please try again.');
      }
    });
  }

  deleteAnalysis(): void {
    if (!this.jobDescription || 
        !confirm(`Are you sure you want to delete "${this.jobDescription.title}"? This action cannot be undone.`)) {
      return;
    }

    this.jobService.deleteJobDescription(this.jobDescription.id).subscribe({
      next: () => {
        alert('Analysis deleted successfully');
        this.router.navigate(['/job-descriptions']);
      },
      error: (error) => {
        console.error('Error deleting job description:', error);
        alert('Failed to delete analysis. Please try again.');
      }
    });
  }

  //Open delete confirmation
  openDeleteConfirmation(): void {
    this.isDeleteConfirmOpen = true;
  }

  //Close delete confirmation
  closeDeleteConfirmation(): void {
    this.isDeleteConfirmOpen = false;
  }

  //Confirm and delete
  confirmDelete(): void {
    if (!this.jobDescription) return;

    this.jobService.deleteJobDescription(this.jobDescription.id).subscribe({
      next: () => {
        this.alertService.success('Analysis deleted successfully');
        this.closeDeleteConfirmation();
        this.router.navigate(['/job-descriptions']);
      },
      error: (error) => {
        console.error('Error deleting job description:', error);
        this.alertService.error('Failed to delete analysis. Please try again.');
        this.closeDeleteConfirmation();
      }
    });
  }

  printResults(): void {
    window.print();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatVerdict(verdict: string): string {
    if (!verdict) return '';
    return verdict.replace(/_/g, ' ');
  }

  getScoreClass(score: number): string {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  getScoreBgClass(score: number): string {
    if (score >= 70) return 'bg-green-50';
    if (score >= 50) return 'bg-yellow-50';
    return 'bg-red-50';
  }
}