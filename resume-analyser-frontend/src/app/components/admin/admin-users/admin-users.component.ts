import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule
  ],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css'] 
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];

  constructor(
    private adminService: AdminService, 
    private alertService: AlertService, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getUsers().subscribe(data => this.users = data);
  }

  updateRole(user: any) {
    if(confirm(`Change role for ${user.email} to ${user.role}?`)) {
      this.adminService.updateUserRole(user.id, user.role).subscribe({
        next: () => this.alertService.success('Role updated'),
        error: () => {
          this.alertService.error('Failed to update role');
          this.loadUsers(); // revert on error
        }
      });
    }
  }

  deleteUser(user: any) {
    if(confirm(`Are you sure you want to permanently delete ${user.email}?`)) {
      this.adminService.deleteUser(user.id).subscribe(() => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.alertService.success('User deleted');
      });
    }
  }
}