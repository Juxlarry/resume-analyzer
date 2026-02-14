import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router'; 
import { JobService, JobDescription } from '../../services/job.service'; 
import { RerunAnalysisModal } from '../rerun-analysis-modal/rerun-analysis-modal.component';
import { Alert, AlertService } from '../../services/alert.service';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { AuthService } from '../../services/auth.service';


@Component({
    selector: 'app-job-descriptions-list', 
    standalone: true, 
    imports: [
        CommonModule, 
        RouterLink, 
        RerunAnalysisModal,
        ConfirmationModalComponent
    ], 
    templateUrl: './job-descriptions-list.component.html', 
    styleUrls: ['./job-descriptions-list.component.css']
})
export class JobDescriptionListComponent implements OnInit {
    jobDescriptions: JobDescription[] = []; 
    isLoading = true; 
    errorMessage: string | null = null
    isAdmin = false;

    // Modal state
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
            next: (data) =>{
                this.jobDescriptions = data;
                this.isLoading = false; 
                this.cdr.detectChanges();
            }, 
            error: (error) => {
                console.error('Error loading job descriptions:', error);

                this.alertService.error("Failed to load job descriptions.");
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
        next: (response) => {
            const message = newResumeFile 
            ? 'Analysis restarted with new resume! Redirecting to details...'
            : 'Analysis restarted with existing resume! Redirecting to details...';
            this.alertService.success(message);
            this.closeRerunModal();
            this.router.navigate(['/job-descriptions', jobId]);
        },
        error: (error) => {
            console.error('Error re-running analysis:', error);

            this.alertService.error("Failed to restart analysis. Please try again.");
            this.closeRerunModal();
        }
        });
    }

    
    reRunAnalysis(job: JobDescription): void {
        if (!confirm(`Are you sure you want to re-run the analysis for "${job.title}"?`)) {
            return;
        }

        this.jobService.analyzeResume(job.id).subscribe({
            next: (response) => {
                this.alertService.info(`Analysis re-started  for "${job.title}". Redirecting to details page.`);

                this.router.navigate(['/job-descriptions', job.id]);
            },
            error: (error) => {
                console.error('Error re-running analysis:', error);
                
                this.alertService.error("Failed to re-run analysis.");
            }
        }); 
    }


    deleteAnalysis(job: JobDescription): void {
        if (!confirm(`Are you sure you want to delete the analysis for "${job.title}"? This action cannot be undone.`)) {
            return;
        }

        this.jobService.deleteJobDescription(job.id).subscribe({
            next: () => {
                this.jobDescriptions = this.jobDescriptions.filter(j => j.id !== job.id); 

                this.alertService.success(`Analysis deleted for "${job.title}" has been deleted.`);
            }, 
            error: (error) => {
                console.error('Error deleting job description:', error);

                this.alertService.error("Failed to delete analysis. Please try again.");
            }
        });
    }

    getStatusClass(status: string): string {
        const classes: { [key: string]: string } = {
        'completed': 'bg-green-100 text-green-800',
        'processing': 'bg-blue-100 text-blue-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'failed': 'bg-red-100 text-red-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }


    getScoreClass(score: number): string {
        if (score >= 70) return 'text-green-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
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
            this.alertService.success('Analysis deleted successfully');
            this.closeDeleteConfirmation();
        },
        error: (error) => {
            console.error('Error deleting job description:', error);
            this.alertService.error('Failed to delete analysis. Please try again.');
            this.closeDeleteConfirmation();
        }
        });
    }
}