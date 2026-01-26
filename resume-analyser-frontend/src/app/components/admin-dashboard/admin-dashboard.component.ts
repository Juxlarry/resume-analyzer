import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JobService, JobDescription } from '../../services/job.service';


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

    constructor(private jobService: JobService) {}


    ngOnInit(): void {
        this.loadDashboardData();
    }

    loadDashboardData(): void {
        this.isLoading = true;

        this.jobService.getJobDescriptions().subscribe({
            next: (jobDescriptions: JobDescription[]) => {
                //Collect stats from the endpoint 
                const completedAnalyses = jobDescriptions.filter( job => job.resume_analysis?.status === 'completed');

                this.stats.total_analyses = completedAnalyses.length;

                //Get today's analyses 
                const today = new Date().toDateString(); 
                this.stats.today_analyses = completedAnalyses.filter( job => new Date(job.created_at).toDateString() === today).length; 

                //Get Average match score 
                if (completedAnalyses.length > 0) {
                    const totalScore = completedAnalyses.reduce( (sum, job) => sum + (job.resume_analysis?.match_score || 0), 0);
                    this.stats.avg_match_score = Math.round(totalScore / completedAnalyses.length);
                }

                //ToDO: Fetch Total users
                this.stats.total_users = 0; //Placeholder
                
                //Get recent analyses 
                this.recentAnalyses = completedAnalyses
                    .sort( (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 10)
                    .map( job => ({
                        id: job.id,
                        job_title: job.title,
                        user_email: "placeholder@gmail.com",
                        match_score: job.resume_analysis?.match_score || 0,
                        created_at: job.created_at
                    }));

                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error fetching dashboard data:', error);
                this.isLoading = false;
            }
        })
        
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