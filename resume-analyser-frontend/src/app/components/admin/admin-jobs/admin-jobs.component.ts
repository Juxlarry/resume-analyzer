import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { AlertService } from '../../../services/alert.service';
import { ConfirmationModalComponent } from '../../confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-admin-jobs',
  standalone: true,
  imports: [RouterLink, FormsModule, ConfirmationModalComponent],
  templateUrl: './admin-jobs.component.html',
  styleUrls: ['./admin-jobs.component.css']
})
export class AdminJobsComponent implements OnInit {
  jobs: any[] = [];
  isLoading = true;
  isExporting = false;
  statusFilter = 'all';

  isDeleteConfirmOpen = false;
  jobToDelete: any = null;
  isDeletingJob = false;

  constructor(
    private adminService: AdminService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading = true;
    this.adminService.getJobs().subscribe({
      next: (data) => {
        this.jobs = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.alertService.error('Failed to load job analyses');
        this.isLoading = false;
      }
    });
  }

  get filteredJobs(): any[] {
    return this.statusFilter === 'all'
      ? this.jobs
      : this.jobs.filter(j => j.analysis_status === this.statusFilter);
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
        this.alertService.success('Job analysis deleted');
        this.jobs = this.jobs.filter(j => j.id !== this.jobToDelete.id);
        this.closeDeleteConfirmation();
        this.isDeletingJob = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.alertService.error('Failed to delete job analysis');
        this.isDeletingJob = false;
      }
    });
  }

  exportJobs(): void {
    this.isExporting = true;
    this.adminService.exportJobs().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `jobs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.alertService.success('Jobs exported successfully');
        this.isExporting = false;
      },
      error: () => {
        this.alertService.error('Failed to export jobs');
        this.isExporting = false;
      }
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      completed: 'bg-hirivo-green-bg text-hirivo-green',
      processing: 'bg-hirivo-teal-light text-hirivo-teal',
      pending:    'bg-hirivo-amber-bg text-hirivo-amber',
      failed:     'bg-hirivo-red-bg text-hirivo-red',
    };
    return map[status] ?? 'bg-hirivo-surface text-hirivo-muted';
  }

  getScoreClass(score: number): string {
    if (score >= 70) return 'text-hirivo-green font-semibold';
    if (score >= 50) return 'text-hirivo-amber font-semibold';
    return 'text-hirivo-red font-semibold';
  }
}