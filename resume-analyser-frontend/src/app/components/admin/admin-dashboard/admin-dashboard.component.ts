import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { AlertService } from '../../../services/alert.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);


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
    @ViewChild('weeklyChart') weeklyChartRef!: ElementRef;
    @ViewChild('statusChart') statusChartRef!: ElementRef; 

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

    private weeklyChart: any; 
    private statusChart: any;

    constructor( 
        private adminService: AdminService, 
        private alertService: AlertService, 
        private cdr: ChangeDetectorRef
    ) {}


    ngOnInit(): void {
        this.loadDashboardAnalytics();  
    }

    ngAfterViewInit(): void {
        // Charts will be created after data is loaded
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

            // Create charts after data is loaded
            setTimeout(() => {
                this.createWeeklyChart();
                this.createStatusChart();
            }, 100);
        },
        error: (error) => {
            console.error('Error loading dashboard:', error);
            this.alertService.error('Failed to load dashboard data');
            this.isLoading = false;
        }
        });
    }

    createWeeklyChart(): void {
        if (!this.weeklyChartRef) return;

        const ctx = this.weeklyChartRef.nativeElement.getContext('2d');
        
        if (this.weeklyChart) {
        this.weeklyChart.destroy();
        }

        this.weeklyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: this.weeklyTrend.map((d: any) => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
            label: 'Analyses',
            data: this.weeklyTrend.map((d: any) => d.count),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
            legend: {
                display: false
            },
            tooltip: {
                mode: 'index',
                intersect: false
            }
            },
            scales: {
            y: {
                beginAtZero: true,
                ticks: {
                stepSize: 1
                }
            }
            }
        }
        });
    }

    createStatusChart(): void {
        if (!this.statusChartRef) return;

        const ctx = this.statusChartRef.nativeElement.getContext('2d');
        
        if (this.statusChart) {
        this.statusChart.destroy();
        }

        this.statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Processing', 'Pending', 'Failed'],
            datasets: [{
            data: [
                this.statusBreakdown.completed,
                this.statusBreakdown.processing,
                this.statusBreakdown.pending,
                this.statusBreakdown.failed
            ],
            backgroundColor: [
                'rgb(34, 197, 94)',
                'rgb(59, 130, 246)',
                'rgb(234, 179, 8)',
                'rgb(239, 68, 68)'
            ],
            borderWidth: 2,
            borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
            legend: {
                position: 'bottom'
            }
            }
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