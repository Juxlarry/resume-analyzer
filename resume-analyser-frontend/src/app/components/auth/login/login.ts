import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { AlertService } from '../../../services/alert.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  otpForm: FormGroup;
  isSubmitting = false;
  showOtpInput = false; 
  verify_user_id: string = '';

  errorMessage: string | null = null;
  isLoading: boolean = false;
  private returnUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router, 
    private alertService: AlertService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    // this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/welcome';

    this.otpForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(8)]]
    });
  } 

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // this.isSubmitting = true;
    // this.errorMessage = null; 

    const { email, password } = this.loginForm.value;

    /** New Login checking 2FA */
    this.authService.login(email, password).subscribe({
      next: (response: any) => {
        if (response.requires_otp){
          this.showOtpInput = true; 
          this.isSubmitting = false; 
          this.verify_user_id = response.otp_user_id;
          this.alertService.info('Please enter your two-factor authentication code');
        }else {
          //Normal Login success 
          this.alertService.success('Login successful');
          this.router.navigate(['/welcome']);
        }
      }, 
      error: (error) => {
        console.error('Login failed: ', error);
        this.isSubmitting = false;
        this.alertService.error(error.error?.error || 'Invalid email or password');

      }
    });
  }


  onVerifyOtp():void {
    if (this.otpForm.invalid){
      return;
    }

    this.isSubmitting = true; 
    const code = this.otpForm.value.code;
    const otp_user_id = this.verify_user_id;

    console.log(`000OTP Code: ${code} \n User_id -- ${this.verify_user_id}`);

    this.authService.verifyOtp(code, otp_user_id).subscribe({
      next: (response) => {
        this.alertService.success('Login Successful'); 
        this.isSubmitting = false; 
        this.router.navigate(['welcome']);
      }, 
      error: (error) => {
        console.error('Otp Verification error: ', error);
        this.isSubmitting = false;
        this.alertService.error(error.error?.error || 'Invalid verification code');
      }
    })
  }

  backToLogin(): void {
    this.showOtpInput = false; 
    this.otpForm.reset();
  }
}
