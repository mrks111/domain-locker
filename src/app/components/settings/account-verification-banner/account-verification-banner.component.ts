import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { SupabaseService } from '@/app/services/supabase.service';
import { GlobalMessageService } from '@/app/services/messaging.service';

@Component({
  selector: 'app-account-verification-banner',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './account-verification-banner.component.html',
  providers: [SupabaseService]
})
export class AccountVerificationBannerComponent {
  emailVerified: boolean = false;
  loading: boolean = true;

  constructor(
    private supabaseService: SupabaseService,
    private messageService: GlobalMessageService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.emailVerified = await this.supabaseService.isEmailVerified();
      this.loading = false;
    } catch (error) {
      console.error('Error checking email verification status:', error);
    }
  }

  async resendEmailVerification(): Promise<void> {
    try {
      await this.supabaseService.resendVerificationEmail();
      this.messageService.showSuccess('Email Sent', 'Verification email has been resent. Please check your inbox.');
    } catch (error) {
      console.error('Error resending verification email:', error);
    }
  }
}
