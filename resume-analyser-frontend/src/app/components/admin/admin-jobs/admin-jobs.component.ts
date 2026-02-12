import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-admin-jobs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-jobs.component.html',
  styleUrls: ['./admin-jobs.component.css'] 
})
export class AdminJobsComponent implements OnInit {
  jobs: any[] = [];

  constructor(
    private adminService: AdminService, 
    private alertService: AlertService
) {}

  ngOnInit() {
    this.loadJobs();
  }

  loadJobs() {
    this.adminService.getJobs().subscribe(data => this.jobs = data);
  }

  deleteJob(id: number) {
    if(confirm('Are you sure? This will delete the job description and its analysis.')) {
      this.adminService.deleteJob(id).subscribe(() => {
        this.jobs = this.jobs.filter(j => j.id !== id);
        this.alertService.success('User deleted');
      });
    }
  }
}