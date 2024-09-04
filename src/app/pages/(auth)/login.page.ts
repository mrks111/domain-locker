// src/app/pages/(auth)/login.page.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModule } from '../../prime-ng.module';

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
  modes = [
    { label: 'Login', value: true },
    { label: 'Sign Up', value: false }
  ];

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router
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

  async onSubmit() {
    if (this.form.valid) {
      try {
        if (this.isLogin) {
          await this.supabaseService.signIn(this.form.get('email')?.value, this.form.get('password')?.value);
        } else {
          await this.supabaseService.signUp(this.form.get('email')?.value, this.form.get('password')?.value);
          this.successMessage = 'Sign up successful! Please check your email to confirm your account.';
          return;
        }
        this.router.navigate(['/']);
      } catch (error) {
        this.errorMessage = this.isLogin ? 'Login failed. Please check your credentials.' : 'Sign up failed. Please try again.';
        console.error(this.isLogin ? 'Login error:' : 'Sign up error:', error);
      }
    }
  }
}
