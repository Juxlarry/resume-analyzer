import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
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
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  signupForm: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;
  errorMessages: string[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, passwordValidator()]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const pw  = control.get('password');
    const cpw = control.get('confirmPassword');
    if (!pw || !cpw) return null;
    return pw.value === cpw.value ? null : { passwordMismatch: true };
  }

  get passwordErrors(): PasswordErrors | null {
    return this.signupForm.get('password')?.errors as PasswordErrors | null;
  }

  get passwordStrength(): 'weak' | 'medium' | 'strong' | '' {
    const pw = this.signupForm.get('password')?.value || '';
    if (!pw.length) return '';
    let s = 0;
    if (pw.length >= 8)                                   s++;
    if (/[A-Z]/.test(pw))                                 s++;
    if (/\d/.test(pw))                                    s++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) s++;
    if (s === 4) return 'strong';
    if (s >= 2)  return 'medium';
    return 'weak';
  }

  get passwordStrengthColor(): string {
    const map: Record<string, string> = {
      strong: 'bg-hirivo-green',
      medium: 'bg-hirivo-amber',
      weak:   'bg-hirivo-red'
    };
    return map[this.passwordStrength] ?? 'bg-hirivo-surface';
  }

  onSubmit(): void {
    if (this.signupForm.invalid) { this.signupForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMessage = null;
    this.errorMessages = [];

    const { email, password, confirmPassword } = this.signupForm.value;
    this.authService.register(email, password, confirmPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/analyze']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Registration failed';
        this.errorMessages = err.error?.errors
          ? (Array.isArray(err.error.errors) ? err.error.errors : [err.error.errors])
          : ['An unexpected error occurred. Please try again.'];
      }
    });
  }
}