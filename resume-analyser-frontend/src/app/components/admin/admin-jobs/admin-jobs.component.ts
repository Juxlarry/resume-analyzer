import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { AlertService } from '../../../services/alert.service';
import { ConfirmationModalComponent } from '../../confirmation-modal/confirmation-modal.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-jobs',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    ConfirmationModalComponent
  ],
  templateUrl: './admin-jobs.component.html',
  styleUrls: ['./admin-jobs.component.css'] 
})
export class AdminJobsComponent implements OnInit {
  jobs: any[] = [];
  isLoading = true;

  isDeleteConfirmOpen = false; 
  jobToDelete: any = null;
  isDeletingJob = false; 

  statusFilter: string = 'all';

  constructor(
    private adminService: AdminService, 
    private alertService: AlertService, 
    private cdr: ChangeDetectorRef
) {}

  ngOnInit() {
    this.loadJobs();
  }

  loadJobs() {
    this.isLoading = true; 

    this.adminService.getJobs().subscribe({
      next: (data) => {
        this.jobs = data; 
        this.isLoading = false; 
        this.cdr.detectChanges();
      }, 
      error: (error) => {
        console.error('Error loading jobs: ', error); 
        this.alertService.error('Failed to load jobs analyses'); 
        this.isLoading = false;
      }
    });
  }

  get filteredJobs(): any[] {
    if (this.statusFilter === 'all') {
      return this.jobs;
    }
    return this.jobs.filter(job => job.analysis_status === this.statusFilter);
  }

  openDeleteConfirmation(job: any): void {
    this.jobToDelete = job;
    this.isDeleteConfirmOpen = true;
  }

  closeDeleteConfirmation(): void {
    this.isDeleteConfirmOpen = false;
    this.jobToDelete = null;
  }

  confirmDelete(): void {
    if (!this.jobToDelete) return;

    this.isDeletingJob = true;

    this.adminService.deleteJob(this.jobToDelete.id).subscribe({
      next: () => {
        this.alertService.success('Job analysis deleted successfully');
        this.jobs = this.jobs.filter(j => j.id !== this.jobToDelete.id);
        this.closeDeleteConfirmation();
        this.isDeletingJob = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error deleting job:', error);
        this.alertService.error('Failed to delete job analysis');
        this.isDeletingJob = false;
      }
    })
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getScoreClass(score: number): string {
    if (score >= 70) return 'text-green-600 font-semibold';
    if (score >= 50) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  }
}