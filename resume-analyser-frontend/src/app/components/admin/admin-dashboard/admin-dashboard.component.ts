import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { AlertService } from '../../../services/alert.service';


interface AnalysisStats {
    total_analyses: number;
    today_analyses: number;
    avg_match_score: number;
    total_users: number;
}

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
        total_analyses: 0,
        today_analyses: 0,
        avg_match_score: 0,
        total_users: 0
    };
    
    recentAnalyses: any[] = [];
    isLoading = true;

    constructor( 
        private adminService: AdminService, 
        private alertService: AlertService, 
        private cdr: ChangeDetectorRef
    ) {}


    ngOnInit(): void {
        this.loadDashboardAnalytics();  
    }

    loadDashboardAnalytics(): void{
        this.adminService.getDashboardStats().subscribe({
            next: (data) => {
            this.stats = data.stats;
            console.log(`${JSON.stringify(this.stats)}`);
            this.recentAnalyses = data.recent_activity;
            this.isLoading = false;
            this.cdr.detectChanges();
            },
            error: (error) => {
            console.error(error);
            this.isLoading = false;
            }
        });
    }

}