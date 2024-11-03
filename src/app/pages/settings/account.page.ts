import { Component, OnInit } from '@angular/core';
import { PrimeNgModule } from '../../prime-ng.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SupabaseService } from '../../services/supabase.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-settings',
  templateUrl: './account.page.html',
  styleUrls: ['./index.page.scss'],
  imports: [PrimeNgModule, ReactiveFormsModule, CommonModule],
  providers: [MessageService, ConfirmationService]
})
export default class UserSettingsComponent implements OnInit {
  emailForm!: FormGroup;
  passwordForm!: FormGroup;
  mfaForm!: FormGroup;
  sessionForm!: FormGroup;
  loading = false;
  user: any; // Replace 'any' with a proper user type if available

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.initializeForms();
    this.loadUserData();
  }

  initializeForms() {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.mfaForm = this.fb.group({
      otpCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    this.sessionForm = this.fb.group({
      sessionTimeout: ['', [Validators.required, Validators.min(1)]]
    });
  }

  async loadUserData() {
    this.loading = true;
    try {
      this.user = await this.supabaseService.getCurrentUser();
      this.emailForm.patchValue({ email: this.user.email });
      // Load other user data as needed
    } catch (error) {
      this.showError('Failed to load user data');
    } finally {
      this.loading = false;
    }
  }

  async updateEmail() {
    if (this.emailForm.valid) {
      this.loading = true;
      try {
        await this.supabaseService.updateEmail(this.emailForm.get('email')!.value);
        this.showSuccess('Email updated successfully');
      } catch (error) {
        this.showError('Failed to update email');
      } finally {
        this.loading = false;
      }
    }
  }

  async updatePassword() {
    if (this.passwordForm.valid) {
      this.loading = true;
      try {
        await this.supabaseService.updatePassword(
          this.passwordForm.get('currentPassword')!.value,
          this.passwordForm.get('newPassword')!.value
        );
        this.showSuccess('Password updated successfully');
        this.passwordForm.reset();
      } catch (error) {
        this.showError('Failed to update password');
      } finally {
        this.loading = false;
      }
    }
  }

  async enableMFA() {
    this.loading = true;
    try {
      const { secret, qrCode } = await this.supabaseService.enableMFA();
      // Display QR code to user (you might want to use a modal for this)
      this.showSuccess('MFA enabled. Please scan the QR code with your authenticator app.');
    } catch (error) {
      this.showError('Failed to enable MFA');
    } finally {
      this.loading = false;
    }
  }

  async verifyMFA() {
    if (this.mfaForm.valid) {
      this.loading = true;
      try {
        await this.supabaseService.verifyMFA(this.mfaForm.get('otpCode')!.value);
        this.showSuccess('MFA verified successfully');
      } catch (error) {
        this.showError('Failed to verify MFA');
      } finally {
        this.loading = false;
      }
    }
  }

  async downloadBackupCodes() {
    this.loading = true;
    try {
      const codes = await this.supabaseService.getBackupCodes();
      // Implement logic to download codes as a file
      this.showSuccess('Backup codes downloaded');
    } catch (error) {
      this.showError('Failed to download backup codes');
    } finally {
      this.loading = false;
    }
  }

  async updateSessionTimeout() {
    if (this.sessionForm.valid) {
      this.loading = true;
      try {
        await this.supabaseService.updateSessionTimeout(this.sessionForm.get('sessionTimeout')!.value);
        this.showSuccess('Session timeout updated');
      } catch (error) {
        this.showError('Failed to update session timeout');
      } finally {
        this.loading = false;
      }
    }
  }

  async exportData() {
    this.loading = true;
    try {
      const data = await this.supabaseService.exportUserData();
      // Implement logic to download data as a file
      this.showSuccess('Data exported successfully');
    } catch (error) {
      this.showError('Failed to export data');
    } finally {
      this.loading = false;
    }
  }

  confirmDeleteAccount() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete your account? This action cannot be undone.',
      accept: () => {
        this.deleteAccount();
      }
    });
  }

  async deleteAccount() {
    this.loading = true;
    try {
      await this.supabaseService.deleteAccount();
      this.showSuccess('Account deleted successfully');
      // Implement logout and redirect logic
    } catch (error) {
      this.showError('Failed to delete account');
    } finally {
      this.loading = false;
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : {'mismatch': true};
  }

  showSuccess(message: string) {
    this.messageService.add({severity:'success', summary:'Success', detail: message});
  }

  showError(message: string) {
    this.messageService.add({severity:'error', summary:'Error', detail: message});
  }
}
