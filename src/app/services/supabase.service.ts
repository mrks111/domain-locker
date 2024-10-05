// src/app/services/supabase.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  public supabase: SupabaseClient;
  private authStateSubject = new BehaviorSubject<boolean>(false);
  authState$ = this.authStateSubject.asObservable();
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  private token: string | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {

    const supabaseUrl = import.meta.env['SUPABASE_URL'];
    const supabaseAnonKey = import.meta.env['SUPABASE_ANON_KEY'];

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and Supabase Anon Key must be provided');
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    this.supabase.auth.onAuthStateChange((event, session) => {
      this.setAuthState(!!session);
    });

    if (isPlatformBrowser(this.platformId)) {
      this.initializeAuth();
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return !!session;
  }

  private initializeAuth() {
    this.token = localStorage.getItem('supabase_token');
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.userSubject.next(session?.user ?? null);
      if (session) {
        this.token = session.access_token;
        localStorage.setItem('supabase_token', session.access_token);
      } else {
        this.token = null;
        localStorage.removeItem('supabase_token');
      }
    });
  }

  setAuthState(isAuthenticated: boolean) {
    this.authStateSubject.next(isAuthenticated);
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    this.setAuthState(false);
    if (error) throw error;
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('supabase_token');
    }
    return this.token;
  }

  setToken(token: string | null) {
    this.token = token;
    if (isPlatformBrowser(this.platformId)) {
      if (token) {
        localStorage.setItem('supabase_token', token);
      } else {
        localStorage.removeItem('supabase_token');
      }
    }
  }

  async verifyEmail() {
    // TODO: Implement email verification logic
    const { error } = await this.supabase.auth.getUser();
    if (error) throw error;
    // The user object should now reflect the verified status
  }

  async updateEmail(newEmail: string): Promise<void> {
    // TODO: Implement email update logic
    const { error } = await this.supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    // TODO: Implement password update logic
    const { error } = await this.supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async enableMFA(): Promise<{ secret: string; qrCode: string }> {
    // TODO: Implement MFA setup logic
    throw new Error('MFA not implemented');
  }

  async verifyMFA(otpCode: string): Promise<void> {
    // TODO: Implement MFA verification logic
    throw new Error('MFA verification not implemented');
  }

  async getBackupCodes(): Promise<string[]> {
    // TODO: Implement backup codes generation logic
    throw new Error('Backup codes not implemented');
  }

  async exportUserData(): Promise<any> {
    // TODO: Implement data export logic
    // This will depend on what data you're storing for users
    throw new Error('Data export not implemented');
  }

  async deleteAccount(): Promise<void> {
    // TODO: Implement account deletion logic
    const { error } = await this.supabase.auth.admin.deleteUser(
      (await this.getCurrentUser()).id
    );
    if (error) throw error;
  }
}
