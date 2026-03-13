import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  otpForm: FormGroup;
  isSubmitting = false;
  showOtpInput = false;
  verify_user_id = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService
  ) {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    this.otpForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(8)]]
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        if (response.requires_otp) {
          this.showOtpInput = true;
          this.verify_user_id = response.otp_user_id;
          this.alertService.info('Please enter your two-factor authentication code.');
        } else {
          this.alertService.success('Welcome back.');
          this.router.navigate(['/welcome']);
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.alertService.error(error.error?.error || 'Invalid email or password.');
      }
    });
  }

  onVerifyOtp(): void {
    if (this.otpForm.invalid) return;
    this.isSubmitting = true;
    this.authService.verifyOtp(this.otpForm.value.code, this.verify_user_id).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.alertService.success('Signed in successfully.');
        this.router.navigate(['/welcome']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.alertService.error(error.error?.error || 'Invalid verification code.');
      }
    });
  }

  backToLogin(): void {
    this.showOtpInput = false;
    this.otpForm.reset();
  }
}