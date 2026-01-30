import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';import { AuthService } from '../../../services/auth.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  private returnUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router, 
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/analyze';
  } 

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null; 

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        console.log('Login successful: ', response);
        // this.isLoading = false;
        // this.router.navigate(['/analyze']);

        //navigating back to where user came from 
        this.router.navigateByUrl(this.returnUrl!);
      }, 
      error: (err) => {
        console.error('Login failed: ', err);
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Invalid email or password.';
      }
    });
  }
}
