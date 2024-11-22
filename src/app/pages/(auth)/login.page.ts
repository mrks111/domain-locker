import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '@/app/services/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { Subscription } from 'rxjs';
import { Session } from '@supabase/supabase-js';
import { GlobalMessageService } from '@/app/services/messaging.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PrimeNgModule,
  ],
  templateUrl: './login.page.html',
  styles: [`
    :host ::ng-deep .p-card {
      margin: auto;
      margin-top: 2rem;
    }
    :host ::ng-deep .p-selectbutton {
      display: flex;
      margin-bottom: 1rem;
    }
    :host ::ng-deep .p-selectbutton .p-button {
      flex: 1;
    }
    .field {
      margin-bottom: 1rem;
    }
    .field-checkbox {
      margin-bottom: 1rem;
    }
  `]
})
export default class LoginPageComponent implements OnInit {
  isLogin = true;
  form: FormGroup;
  errorMessage = '';
  successMessage = '';
  showLoader = false;
  isAuthenticated: boolean = false;
  showResendEmail = false;
  modes = [
    { label: 'Login', value: true },
    { label: 'Sign Up', value: false }
  ];

  requireMFA = false;
  factorId: string | null = null;
  challengeId: string | null = null
  partialSession: any;

  private subscriptions: Subscription = new Subscription();
  
  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private messagingService: GlobalMessageService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: [''],
      mfaCode: ['', [Validators.pattern(/^\d{6}$/)]],
      acceptTerms: [false]
    });
  }

  ngOnInit() {
    this.onModeChange();

    this.subscriptions.add(
      this.supabaseService.authState$.subscribe(isAuthenticated => {
        this.isAuthenticated = isAuthenticated;
        this.cdr.detectChanges();
      })
    );

    // Initial check for auth status
    this.checkAuthStatus();
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async checkAuthStatus() {
    const isAuthenticated = await this.supabaseService.isAuthenticated();
    this.supabaseService.setAuthState(isAuthenticated);
  }

  onModeChange() {
    this.errorMessage = '';
    this.successMessage = '';
    this.requireMFA = false; // Reset MFA-specific UI
    this.factorId = null;
    this.challengeId = null;
    this.form.get('mfaCode')?.reset();
  
    if (this.isLogin) {
      this.form.get('confirmPassword')?.clearValidators();
      this.form.get('acceptTerms')?.clearValidators();
    } else {
      this.form.get('confirmPassword')?.setValidators([Validators.required, this.passwordMatchValidator.bind(this)]);
      this.form.get('acceptTerms')?.setValidators([Validators.requiredTrue]);
    }
    this.form.get('confirmPassword')?.updateValueAndValidity();
    this.form.get('acceptTerms')?.updateValueAndValidity();
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = this.form.get('password')?.value;
    const confirmPassword = control.value;
    return password === confirmPassword ? null : { 'passwordMismatch': true };
  }

  signOut() {
    this.supabaseService.signOut();
  }

  async onSubmit() {
    if (!this.form.valid || (this.requireMFA && this.form.get('mfaCode')?.invalid)) return;
  
    this.resetMessages();
    this.showLoader = true;
  
    try {
      await this.performAuthAction();
    } catch (error) {
      this.handleError(error);
    } finally {
      this.showLoader = false;
    }
  }
  
  private resetMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  async loginWithGitHub(): Promise<void> {
    console.log('Logging in with GitHub...');
    try {
      await this.supabaseService.signInWithGitHub();
    } catch (error: any) {
      console.error('Error during GitHub login:', error.message);
    }
  }

  async loginWithGoogle(): Promise<void> {}
  async loginWithFacebook(): Promise<void> {}
  
  private async performAuthAction(): Promise<void> {
    const email = this.form.get('email')?.value;
    const password = this.form.get('password')?.value;
    const mfaCode = this.form.get('mfaCode')?.value;
    if (!email || !password) throw new Error('Email and password are required.');
    const delayTimeout = 15000;

    if (this.isLogin) { // Login
      console.log('Starting login...');
      try {
        if (this.requireMFA && mfaCode) {
          console.log('MFA code provided - verifying...');
          // User has provided MFA code - verify it
          if (!this.factorId) throw new Error('No factor ID available');
            try {
              await this.supabaseService.verifyMFA(
                this.factorId,
                this.form.get('mfaCode')?.value
              );
            } catch (error) {
              this.handleError(error);
              return;
            }
          this.requireMFA = false;
          this.handleSuccess();
        } else {
          console.log('No MFA code provided (yet) - checking credentials...');
          // Initial login attempt - verify credentials and check MFA
          const { requiresMFA, factors } = await this.supabaseService.signIn(email, password);
          console.log({ requiresMFA, factors });

          if (requiresMFA && factors.length > 0) {
            // Enable MFA input for next step
            console.log('MFA required - enabling MFA input...');
            this.requireMFA = true;
            this.factorId = factors[0].id;
            this.form.get('mfaCode')?.setValidators([
              Validators.required, 
              Validators.pattern(/^\d{6}$/)
            ]);
            this.form.get('mfaCode')?.updateValueAndValidity();
            this.successMessage = 'Please enter your 2FA code to continue';
            this.cdr.detectChanges();
          } else {
            console.log('No MFA required - proceeding with login...');
            // No MFA required - proceed with login
            this.handleSuccess();
          }
        }
      } catch (error) {
        this.handleError(error);
        console.log('Login attempt failed:', error);
      } finally {
        console.log('Login attempt complete.');
        this.showLoader = false;
      }

    } else { // Sign up
      const authPromise = this.supabaseService.signUp(email, password);
      const timeoutPromise = this.createTimeout(delayTimeout);
      const result = await Promise.race([authPromise, timeoutPromise]);
      if (result instanceof Error) {
        throw result;
      }
    }
  }
  
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), ms);
    });
  }
  
  private handleSuccess() {
    if (this.requireMFA) {
      this.successMessage = '2FA verification is enabled. Please enter your code when prompted';
      this.messagingService.showInfo('2FA Enabled', 'Please enter your 2FA code to continue');
    } else if (this.isLogin) {
      this.successMessage = 'Login successful! Redirecting...';
      this.messagingService.showSuccess('Login Successful', 'Redirecting...');
      this.router.navigate(['/']);
    } else {
      this.messagingService.showSuccess('Sign Up Successful', 'Awaiting account confirmation...');
      this.successMessage = 'Sign up successful! Please check your email to confirm your account.';
    }
    this.cdr.detectChanges();
  }
  
  private handleError(error: unknown) {
    const formType = this.isLogin ? 'Login' : 'Sign up';
    if (error instanceof Error) {
      if (error.message === 'Request timed out') {
        this.errorMessage = 'Request timed out. Please try again.';
      } else if (this.isSupabaseAuthError(error)) {
        this.errorMessage = `${formType} Error: ${error.error.message}`;
      } else {
        this.errorMessage = error.message;
      }
      if (error.message.includes('Email not confirmed')) {
        this.showResendEmail = true;
      }
    } else {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
    }
    this.cdr.detectChanges();
  }
  
  private isSupabaseAuthError(error: any): error is { error: { message: string } } {
    return error && typeof error === 'object' && 'error' in error && 
           typeof error.error === 'object' && 'message' in error.error;
  }

  public resendVerificationEmail() {
    this.showLoader = true;
    try {
      this.supabaseService.resendVerificationEmail(this.form.get('email')?.value);
      this.successMessage = 'Verification email resent successfully.';
      this.errorMessage = '';
      this.showResendEmail = false;
      this.showLoader = false;
    } catch (error: any) {
      this.errorMessage = 'Failed to resend verification email. Please try again.';
      this.showLoader = false;
    }
  }
  
}
