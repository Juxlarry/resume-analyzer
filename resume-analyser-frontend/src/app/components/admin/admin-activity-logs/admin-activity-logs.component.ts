import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-admin-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-activity-logs.component.html',
  styleUrls: ['./admin-activity-logs.component.css']
})
export class AdminActivityLogsComponent implements OnInit {
  logs: any[] = [];
  isLoading = true;

  // Pagination
  currentPage = 1;
  perPage = 50;
  totalPages = 1;
  totalCount = 0;

  // Filter
  actionFilter = 'all';

  // Stats
  stats: any = {
    total_actions: 0,
    today_actions: 0,
    action_breakdown: {}
  };

  Object = Object;
  Math = Math;

  constructor(
    private adminService: AdminService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLogs();
    this.loadStats();
  }

  loadLogs(page: number = 1): void {
    this.isLoading = true;
    this.currentPage = page;

    this.adminService.getActivityLogs(page, this.perPage, this.actionFilter).subscribe({
      next: (response: any) => {
        this.logs = response.logs;
        this.totalCount = response.pagination?.total_count || 0;
        this.totalPages = response.pagination?.total_pages || 1;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading logs:', error);
        this.alertService.error('Failed to load activity logs');
        this.isLoading = false;
      }
    });
  }

  loadStats(): void {
    this.adminService.getActivityLogStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  onFilterChange(): void {
    this.loadLogs(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadLogs(page);
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getActionBadgeClass(action: string): string {
    switch (action) {
      case 'user_created':
        return 'bg-green-100 text-green-800';
      case 'user_updated':
      case 'role_changed':
        return 'bg-blue-100 text-blue-800';
      case 'user_deleted':
      case 'job_deleted':
        return 'bg-red-100 text-red-800';
      case 'analysis_viewed':
        return 'bg-purple-100 text-purple-800';
      case 'settings_changed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatAction(action: string): string {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getMostCommonAction(): string {
    const keys = Object.keys(this.stats.action_breakdown);
    return keys.length > 0 ? this.formatAction(keys[0]) : 'None';
  }
}