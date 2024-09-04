// src/app/pages/(auth)/login.page.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModule } from '../../prime-ng.module';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    SelectButtonModule,
    CheckboxModule,
    MessageModule,
    PrimeNgModule,
  ],
  template: `
    <p-card styleClass="w-[500px] max-w-full sm:w-[calc(100%-2rem)] sm:max-w-full sm:px-4 md:w-[500px] xl:w-[600px] 2xl:w-[700px] p-card-shadow">
      <ng-template pTemplate="title">
        {{ isLogin ? 'Login' : 'Sign Up' }}
      </ng-template>
      <ng-template pTemplate="subtitle">
        Welcome to Domain Locker
      </ng-template>
      <ng-template pTemplate="content">
        <p-selectButton [options]="modes" [(ngModel)]="isLogin" optionLabel="label" optionValue="value"
                        (onChange)="onModeChange()"></p-selectButton>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-fluid">
          <div class="field">
            <label for="email" class="block">Email</label>
            <input type="email" pInputText id="email" formControlName="email" />
            <p-message *ngIf="form.get('email')?.invalid && form.get('email')?.touched" severity="error"
                       text="Valid email is required"></p-message>
          </div>

          <div class="field">
            <label for="password" class="block">Password</label>
            <p-password id="password" formControlName="password" [toggleMask]="true"
                        [promptLabel]="isLogin ? 'Enter password' : 'Choose a password'"
                        weakLabel="Too simple" mediumLabel="Average complexity" strongLabel="Complex password"
                        [feedback]="!isLogin"></p-password>
            <p-message *ngIf="form.get('password')?.invalid && form.get('password')?.touched" severity="error"
                       text="Password is required and must be at least 6 characters long"></p-message>
          </div>

          <div *ngIf="!isLogin" class="field">
            <label for="confirmPassword" class="block">Confirm Password</label>
            <p-password id="confirmPassword" formControlName="confirmPassword" [toggleMask]="true"
                        [feedback]="false"></p-password>
            <p-message *ngIf="form.get('confirmPassword')?.invalid && form.get('confirmPassword')?.touched" severity="error"
                       text="Passwords do not match"></p-message>
          </div>

          <div *ngIf="!isLogin" class="field-checkbox">
            <p-checkbox formControlName="acceptTerms" [binary]="true" label="I agree to the terms and conditions"></p-checkbox>
            <p-message *ngIf="form.get('acceptTerms')?.invalid && form.get('acceptTerms')?.touched" severity="error"
                       text="You must agree to the terms and conditions"></p-message>
          </div>

          <p-button type="submit" [label]="isLogin ? 'Login' : 'Sign Up'" styleClass="w-full"
                    [disabled]="form.invalid"></p-button>
        </form>
      </ng-template>
    </p-card>
    <p-message *ngIf="errorMessage" severity="error" [text]="errorMessage" styleClass="w-full mt-4"></p-message>
  `,
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
          this.errorMessage = 'Sign up successful! Please check your email to confirm your account.';
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
