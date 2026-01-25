import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface AnalysisStats {
    total_analyses: number;
    today_analyses: number;
    avg_match_score: number;
    total_users: number;
}

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
    stats: AnalysisStats = {
        total_analyses: 0,
        today_analyses: 0,
        avg_match_score: 0,
        total_users: 0
    };
    
    recentAnalyses: any[] = [];
    isLoading = true;

    ngOnInit(): void {
        this.loadDashboardData();
    }

    loadDashboardData(): void {
        this.isLoading = true;
        
        // Mock data for now - replace with actual API call later
        setTimeout(() => {
            this.stats = {
                total_analyses: 1234,
                today_analyses: 45,
                avg_match_score: 72,
                total_users: 567
            };
            
            this.recentAnalyses = [
                {
                    id: 1,
                    job_title: 'Senior Ruby Developer',
                    user_email: 'user@example.com',
                    match_score: 85,
                    created_at: new Date()
                },
                {
                    id: 2,
                    job_title: 'Full Stack Engineer',
                    user_email: 'dev@example.com',
                    match_score: 67,
                    created_at: new Date()
                }
            ];
            
            this.isLoading = false;
        }, 1000);
    }
}