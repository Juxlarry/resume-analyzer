import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-forgot-password.component',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isSubmitting = false; 
  isEmailSent = false; 

  constructor(
    private fb: FormBuilder,
    private authService: AuthService, 
    private alertService: AlertService
  ){
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void{
    if(this.forgotPasswordForm.invalid){
      return;
    }

    this.isSubmitting = true; 
    const email = this.forgotPasswordForm.value.email; 

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.isEmailSent = true; 
        this.alertService.success("Password reset instructions have been sent to your email."); 
        this.isSubmitting = false; 
      }, 
      error: (error) => {
        console.error("Forgot password error: ", error); 
        this.alertService.error(error.error?.errors?.join(', ') || "Failed to send reset instructions.");
        this.isSubmitting = false; 
      }
    }); 
  }
}
