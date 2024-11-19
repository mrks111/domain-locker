import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModule } from '../../prime-ng.module';
import { Subscription } from 'rxjs';

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

  private subscriptions: Subscription = new Subscription();
  
  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: [''],
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
    if (!this.form.valid) return;
  
    this.resetMessages();
    this.showLoader = true;
  
    try {
      await this.performAuthAction();
      this.handleSuccess();
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
    const authPromise = this.isLogin
      ? this.supabaseService.signIn(this.form.get('email')?.value, this.form.get('password')?.value)
      : this.supabaseService.signUp(this.form.get('email')?.value, this.form.get('password')?.value);
    const timeoutPromise = this.createTimeout(15000);
    const result = await Promise.race([authPromise, timeoutPromise]);
    if (result instanceof Error) {
      throw result;
    }
  }
  
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), ms);
    });
  }
  
  private handleSuccess() {
    if (this.isLogin) {
      this.successMessage = 'Login successful! Redirecting...';
      this.router.navigate(['/']);
    } else {
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
