import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { AlertService } from '../../../services/alert.service';
import { ConfirmationModalComponent } from '../../confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, ConfirmationModalComponent],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  isLoading = true;

  currentPage = 1;
  perPage = 20;
  totalPages = 1;
  totalCount = 0;

  searchQuery = '';
  isSearching = false;
  isExporting = false;

  isDeleteConfirmOpen = false;
  userToDelete: any = null;
  isDeletingUser = false;

  isRoleChangeConfirmOpen = false;
  userToChangeRole: any = null;
  newRole = '';
  isChangingRole = false;

  constructor(
    private adminService: AdminService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page: number = 1): void {
    this.isLoading = true;
    this.currentPage = page;
    this.adminService.getUsers().subscribe({
      next: (response: any) => {
        if (response.users) {
          this.users = response.users;
          this.totalCount = response.pagination?.total_count || this.users.length;
          this.totalPages = response.pagination?.total_pages || 1;
        } else {
          this.users = response;
        }
        this.isLoading = false;
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.alertService.error('Failed to load users');
        this.isLoading = false;
        this.isSearching = false;
      }
    });
  }

  onSearch(): void {
    this.isSearching = true;
    this.loadUsers(1);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }

  exportUsers(): void {
    this.isExporting = true;
    this.adminService.exportUsers(this.searchQuery).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.alertService.success('Users exported successfully');
        this.isExporting = false;
      },
      error: () => {
        this.alertService.error('Failed to export users');
        this.isExporting = false;
      }
    });
  }

  onRoleChange(user: any, event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.userToChangeRole = { ...user };
    this.newRole = select.value;
    select.value = user.role;
    this.isRoleChangeConfirmOpen = true;
  }

  confirmRoleChange(): void {
    if (!this.userToChangeRole) return;
    this.isChangingRole = true;
    this.adminService.updateUserRole(this.userToChangeRole.id, this.newRole).subscribe({
      next: () => {
        this.alertService.success(`Role updated to ${this.newRole}`);
        this.loadUsers(this.currentPage);
        this.closeRoleChangeConfirmation();
        this.isChangingRole = false;
      },
      error: () => {
        this.alertService.error('Failed to update role');
        this.isChangingRole = false;
      }
    });
  }

  closeRoleChangeConfirmation(): void {
    this.isRoleChangeConfirmOpen = false;
    this.userToChangeRole = null;
    this.newRole = '';
  }

  openDeleteConfirmation(user: any): void {
    this.userToDelete = user;
    this.isDeleteConfirmOpen = true;
  }

  closeDeleteConfirmation(): void {
    this.isDeleteConfirmOpen = false;
    this.userToDelete = null;
  }

  confirmDelete(): void {
    if (!this.userToDelete) return;
    this.isDeletingUser = true;
    this.adminService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.alertService.success('User deleted successfully');
        this.loadUsers(this.currentPage);
        this.closeDeleteConfirmation();
        this.isDeletingUser = false;
      },
      error: () => {
        this.alertService.error('Failed to delete user');
        this.isDeletingUser = false;
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.loadUsers(page);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  getRoleBadgeClass(role: string): string {
    const map: Record<string, string> = {
      admin: 'bg-hirivo-red-bg text-hirivo-red',
      moderator: 'bg-hirivo-gold-light text-hirivo-gold',
      user: 'bg-hirivo-teal-light text-hirivo-teal'
    };
    return map[role] ?? map['user'];
  }
}