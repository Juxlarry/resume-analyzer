import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, TwoFactorStatusResponse } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-two-factor-settings',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    RouterLink, 
  ],
  templateUrl: './two-factor-settings.component.html',
  styleUrl: './two-factor-settings.component.css',
})
export class TwoFactorSettingsComponent implements OnInit {
  status: TwoFactorStatusResponse | null = null; 
  isLoading = true; 

  //Disable 2FA modal 
  isDisableModalOpen = false; 
  disableForm: FormGroup; 
  isDisabling = false; 

  //Regenerate Backup codes modal 
  isRegenerateModalOpen = false; 
  regenerateForm: FormGroup;
  isRegenerating = false; 
  newBackupCodes: string[] = [];
  showNewBackupCodes = false; 

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private alertService: AlertService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ){
    this.disableForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6)]]
    }); 

    this.regenerateForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6)]]
    });
  }


  ngOnInit(): void {
    this.loadStatus();
  }


  loadStatus(): void {
    this.isLoading = true; 

    this.authService.getTwoFactorStatus().subscribe({
      next: (status) => {
        this.status = status; 
        this.isLoading = false; 
        this.cdr.detectChanges();
      }, 
      error: (error) => {
        console.error('Error loading 2FA status:', error);
        this.alertService.error('Failed to load 2FA status');
        this.isLoading = false;
      }
    });
  }


  openDisableModal(): void{
    this.isDisableModalOpen = true;
  }

  closeDisableModal(): void{
    this.isDisableModalOpen = false;
    this.disableForm.reset();
  }

  confirmDisable(): void {
    if (this.disableForm.invalid){
      return;
    }

    this.isDisabling = true; 
    const code = this.disableForm.value.code;

    this.authService.disableTwoFactor(code).subscribe({
      next: (response) => {
        this.alertService.success('Two-factor authentication disabled successfully');
        this.closeDisableModal(); 
        this.loadStatus();
        this.isDisabling = false;
      }, 
      error: (error) => {
        console.error('Error disabling 2FA:', error);
        this.alertService.error(error.error?.error || 'Invalid verification code');
        this.isDisabling = false;
      }
    });
  }


  openRegenerateModal(): void{
    this.isRegenerateModalOpen = true; 
    this.showNewBackupCodes = false; 
    this.newBackupCodes = [];
  }

  closeRegenerateModal(): void{
    this.isRegenerateModalOpen = false; 
    this.newBackupCodes = []; 
    this.regenerateForm.reset(); 
    this.showNewBackupCodes = false; 
  }

  confirmRegenerate(): void{
    if(this.regenerateForm.invalid){
      return;
    }

    this.isRegenerating = true;
    const regenerateCode = this.regenerateForm.value.code; 

    this.authService.regenerateBackupCodes(regenerateCode).subscribe({
      next: (response) => {
        this.newBackupCodes = response.backup_codes; 
        this.showNewBackupCodes = true; 
        this.isRegenerating = false; 
        this.alertService.success('Backup codes regenerated successfully');
      }, 
      error: (error)=>{
        console.log('Regenerate Codes failed: ', error); 
        this.alertService.error(error.error?.error || 'Invalid verification code'); 
        this.isRegenerating = false;
      }
    });
  }

  copyToClipboard(text: string): void{
    navigator.clipboard.writeText(text).then(()=>{
      this.alertService.info('Copied to clipboard!');
    });
  }
  
  copyAllBackupCodes():void{
    const allCodes = this.newBackupCodes.join('\n'); 
    navigator.clipboard.writeText(allCodes).then(() => {
      this.alertService.info('All backup codes copied to clipboard!');
    });
  }


  downloadBackupCodes(): void{
    const content = `Resume Analyser - Two-Factor Authentication Backup Codes Generated: ${new Date().toLocaleString}
    IMPORTANT: Store these codes in a safe place. Each code can only be used once.
    ${this.newBackupCodes.map((code, i) => `${i+1}. ${code}`).join('\n')}
    If you lose access to your authentication app, you can use these codes to log in.`; 

    const blob = new Blob([content], { type: 'text/plain' }); 
    const url = window.URL.createObjectURL(blob); 
    const link = document.createElement('a'); 
    link.href = url;
    link.download = `resume-analyser-backup-codes-${Date.now()}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.alertService.success('Backup codes downloaded!');
  }


  finishRegenerate():void{
    this.closeRegenerateModal(); 
    this.regenerateForm.reset();
  }
} 
