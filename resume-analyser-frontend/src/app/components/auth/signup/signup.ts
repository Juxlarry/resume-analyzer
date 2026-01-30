import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';import { AuthService } from '../../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { passwordValidator } from '../../../validators/password.validator';

interface PasswordErrors {
  minLength?: boolean;
  uppercase?: boolean;
  number?: boolean;
  specialChar?: boolean;
  [key: string]: any; 
}


@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  signupForm: FormGroup;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  errorMessages: string[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ){
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordValidator()]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password'); 
    const confirmPassword = control.get('confirmPassword');

    if (!password || ! confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordsMismatch: true };
  }


  get passwordErrors(): PasswordErrors | null {
    return this.signupForm.get('password')?.errors as PasswordErrors | null;
  }

  get passwordStrength(): string {
    const password = this.signupForm.get('password')?.value || '';
    
    if (password.length === 0) return '';
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;
    
    if (strength === 4) return 'strong';
    if (strength >= 2) return 'medium';
    return 'weak';
  }

  get passwordStrengthColor(): string {
    const strength = this.passwordStrength;
    if (strength === 'strong') return 'bg-green-500';
    if (strength === 'medium') return 'bg-yellow-500';
    return 'bg-red-500';
  }

  onSubmit(): void {
    if(this.signupForm.invalid){
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.errorMessages = [];

    const { email, password, confirmPassword }  = this.signupForm.value;

    this.authService.register(email, password, confirmPassword).subscribe({
      next: (response) => {
        console.log('Signup successful: ', response); 

        this.router.navigate(['/analyze']);
        this.isLoading = false;
      }, 
      error: (err) => {
        console.error('Signup failed: ', err);
        this.errorMessage = 'Resgistration failed';

      if (err.error?.errors){
        this.errorMessages = Array.isArray(err.error.errors) 
        ? err.error.errors
        : [err.error.errors];
      }else {
        this.errorMessages = ['An unexpected error occurred. Please try again later.'];
      }

        this.isLoading = false;
        
      }
    });
  }
}
