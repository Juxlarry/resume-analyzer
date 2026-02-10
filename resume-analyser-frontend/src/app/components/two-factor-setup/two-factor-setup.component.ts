import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, TwoFactorSetupResponse } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-two-factor-setup',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink
  ],
  templateUrl: './two-factor-setup.component.html',
  styleUrls: ['./two-factor-setup.component.css']
})
export class TwoFactorSetupComponent implements OnInit {
  setupForm: FormGroup;
  isLoading = true;
  isEnabling = false;
  setupData: TwoFactorSetupResponse | null = null;
  qrCodeSvg: SafeHtml | null = null;
  backupCodes: string[] = [];
  showBackupCodes = false;
  currentStep: 'setup' | 'verify' | 'backup' = 'setup';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private alertService: AlertService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {
    this.setupForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  ngOnInit(): void {
    this.loadSetup();
  }

  loadSetup(): void {
    this.isLoading = true;

    this.authService.getTwoFactorSetup().subscribe({
      next: (data) => {
        this.setupData = data;
        this.qrCodeSvg = this.sanitizer.bypassSecurityTrustHtml(data.qr_code);
        this.isLoading = false;
        this.currentStep = 'verify';
      },
      error: (error) => {
        console.error('Error loading 2FA setup:', error);
        this.alertService.error('Failed to load 2FA setup. Please try again.');
        this.isLoading = false;
      }
    });
  }

  onEnable(): void {
    if (this.setupForm.invalid) {
      return;
    }

    this.isEnabling = true;
    const code = this.setupForm.value.code;

    this.authService.enableTwoFactor(code).subscribe({
      next: (response) => {
        this.backupCodes = response.backup_codes;
        this.currentStep = 'backup';
        this.isEnabling = false;
        this.alertService.success('Two-factor authentication enabled successfully!');
      },
      error: (error) => {
        console.error('Error enabling 2FA:', error);
        this.alertService.error(error.error?.error || 'Invalid verification code');
        this.isEnabling = false;
      }
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.alertService.success('Copied to clipboard!');
    });
  }

  copyAllBackupCodes(): void {
    const allCodes = this.backupCodes.join('\n');
    navigator.clipboard.writeText(allCodes).then(() => {
      this.alertService.success('All backup codes copied to clipboard!');
    });
  }

  downloadBackupCodes(): void {
    const content = `Resume Analyzer - Two-Factor Authentication Backup Codes
    Generated: ${new Date().toLocaleString()}

    IMPORTANT: Store these codes in a safe place. Each code can only be used once.

    ${this.backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

    If you lose access to your authenticator app, you can use these codes to log in.
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume-analyzer-backup-codes-${Date.now()}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.alertService.success('Backup codes downloaded!');
  }

  finish(): void {
    this.router.navigate(['/profile']);
  }
}