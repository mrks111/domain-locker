import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '@/app/services/supabase.service';
import { GlobalMessageService } from '@/app/services/messaging.service';
import { ErrorHandlerService } from '@/app/services/error-handler.service';

@Component({
  standalone: true,
  selector: 'app-auth-callback',
  template: `<p>Processing GitHub login...</p>`,
})
export default class AuthCallbackComponent implements OnInit {
  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private messagingService: GlobalMessageService,
    private errorHandlerService: ErrorHandlerService
  ) {}

  private errorHappened(error: Error | any) {
    this.errorHandlerService.handleError({
      message: 'Unable to authenticate with your GitHub account',
      error,
      location: 'auth-callback',
      showToast: true,
    });
    this.router.navigate(['/login']);
  }

  async ngOnInit(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.supabase.auth.exchangeCodeForSession(window.location.href);

      if (error) {
        this.errorHappened(error);
        return;
      }

      // Successfully logged in
      console.log('GitHub login successful:', data);
      this.messagingService.showSuccess('Authenticated', 'Successfully logged in with GitHub');
      this.router.navigate(['/']);
    } catch (error) {
      this.errorHappened(error);
    }
  }
}
