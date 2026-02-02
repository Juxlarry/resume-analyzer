import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Form, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { RouterLink } from '@angular/router';

@Component({ 
  selector: 'app-user-profile',
  imports: [CommonModule, ReactiveFormsModule,RouterLink],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
})
export class UserProfile {
  profile: User | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isLoading = true;
  isSaving = false;
  errorMessage: string | null = null
  successMessage: string | null = null; 
  showPasswordForm = false; 

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private cdr: ChangeDetectorRef
  ){
    this.profileForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.profileForm.patchValue({
          email: data.email
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      }, 
      error: (error) => {
        console.error('Error loading profile:', error); 
        this.errorMessage = 'Failed to load profile. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateEmail(): void {
    if (this.profileForm.invalid) return; 

    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.updateProfile({
      email: this.profileForm.value.email
    }).subscribe({
      next: (response) => {
        this.successMessage = 'Email updated successfully!'; 
        this.isSaving = false;
        if (this.profile) {
          this.profile.email = this.profileForm.value.email;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error updating email:', error);
        this.errorMessage = error.error?.errors?.join(', ') || 'Failed to update email';
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) return;

    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.updateProfile({
      password: this.passwordForm.value.password,
      password_confirmation: this.passwordForm.value.password_confirmation
    }).subscribe({
      next: (response) => {
        this.successMessage = 'Password updated successfully!';
        this.isSaving = false;
        this.passwordForm.reset();
        this.showPasswordForm = false; 
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error updating password:', error);
        this.errorMessage = error.error?.errors?.join(', ') || 'Failed to update password';
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }


  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm; 

    if(!this.showPasswordForm){
      this.passwordForm.reset();
      this.errorMessage = null; 
    }
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('password_confirmation')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}
