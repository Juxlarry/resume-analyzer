import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-admin-activity-logs',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-activity-logs.component.html',
  styleUrls: ['./admin-activity-logs.component.css']
})
export class AdminActivityLogsComponent implements OnInit {
  logs: any[] = [];
  isLoading = true;

  currentPage = 1;
  perPage = 50;
  totalPages = 1;
  totalCount = 0;

  actionFilter = 'all';

  stats: any = { total_actions: 0, today_actions: 0, action_breakdown: {} };

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
      error: () => {
        this.alertService.error('Failed to load activity logs');
        this.isLoading = false;
      }
    });
  }

  loadStats(): void {
    this.adminService.getActivityLogStats().subscribe({
      next: (stats) => { this.stats = stats; },
      error: (err) => console.error('Stats error:', err)
    });
  }

  onFilterChange(): void { this.loadLogs(1); }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.loadLogs(page);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getActionBadgeClass(action: string): string {
    const map: Record<string, string> = {
      user_created:    'bg-hirivo-green-bg text-hirivo-green',
      user_updated:    'bg-hirivo-teal-light text-hirivo-teal',
      role_changed:    'bg-hirivo-teal-light text-hirivo-teal',
      user_deleted:    'bg-hirivo-red-bg text-hirivo-red',
      job_deleted:     'bg-hirivo-red-bg text-hirivo-red',
      analysis_viewed: 'bg-hirivo-gold-light text-hirivo-gold',
      settings_changed:'bg-hirivo-amber-bg text-hirivo-amber',
    };
    return map[action] ?? 'bg-hirivo-surface text-hirivo-muted';
  }

  formatAction(action: string): string {
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  getMostCommonAction(): string {
    const keys = Object.keys(this.stats.action_breakdown);
    return keys.length > 0 ? this.formatAction(keys[0]) : 'None';
  }
}