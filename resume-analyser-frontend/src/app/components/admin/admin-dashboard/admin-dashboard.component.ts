import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { AlertService } from '../../../services/alert.service';


@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [
        CommonModule, 
        RouterLink
    ],
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {

    stats: any = {
        total_users: 0,
        active_users: 0,
        total_analyses: 0,
        today_analyses: 0,
        week_analyses: 0,
        avg_match_score: 0,
        success_rate: 0,
        users_with_2fa: 0
  };

    statusBreakdown: any = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
    };
    
    recentAnalyses: any[] = [];
    weeklyTrend: any[] = [];
    isLoading = true;

    constructor( 
        private adminService: AdminService, 
        private alertService: AlertService, 
        private cdr: ChangeDetectorRef
    ) {}


    ngOnInit(): void {
        this.loadDashboardAnalytics();  
    }

    loadDashboardAnalytics(): void {
        this.isLoading = true;
        
        this.adminService.getDashboardStats().subscribe({
        next: (data) => {
            this.stats = data.stats;
            this.statusBreakdown = data.status_breakdown;
            this.recentAnalyses = data.recent_activity;
            this.weeklyTrend = data.weekly_trend;
            this.isLoading = false;
            this.cdr.detectChanges();
        },
        error: (error) => {
            console.error('Error loading dashboard:', error);
            this.alertService.error('Failed to load dashboard data');
            this.isLoading = false;
        }
        });
    }


    getStatusPercentage(status: string): number {
        const values = Object.values(this.statusBreakdown) as number[];
        const total = values.reduce((sum, value) => sum + value, 0);
        
        if (total === 0) return 0;
        
        return Math.round((this.statusBreakdown[status] / total) * 100);
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
        });
    }


}