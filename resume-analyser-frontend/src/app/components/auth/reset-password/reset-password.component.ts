import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    // RouterLink
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isSubmitting = false;
  resetToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private alertService: AlertService
  ) {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirmation: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.resetToken = this.route.snapshot.queryParams['reset_password_token'];
    
    if (!this.resetToken) {
      this.alertService.error('Invalid or missing reset token');
      this.router.navigate(['/forgot-password']);
    }
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('passwordConfirmation')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid || !this.resetToken) {
      return;
    }

    this.isSubmitting = true;

    this.authService.resetPassword(
      this.resetToken,
      this.resetPasswordForm.value.password,
      this.resetPasswordForm.value.passwordConfirmation
    ).subscribe({
      next: (response) => {
        this.alertService.success('Your password has been reset successfully. Please log in.');
        this.isSubmitting = false;
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Reset password error:', error);
        this.alertService.error(error.error?.errors?.join(', ') || 'Failed to reset password.');
        this.isSubmitting = false;
      }
    });
  }
}