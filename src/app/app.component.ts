import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { PrimeNgModule } from './prime-ng.module';

import { isPlatformBrowser } from '@angular/common';
import { SupabaseService } from './services/supabase.service';
import { CommonModule } from '@angular/common'; // Import CommonModule

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, PrimeNgModule, CommonModule], // Add CommonModule to the imports array
  template: `
    <app-navbar></app-navbar>
    <div class="content-container">
      <!-- Show a loading spinner or message while the authentication check is in progress -->
      <ng-container *ngIf="!loading">
        <router-outlet></router-outlet>
      </ng-container>
      <div *ngIf="loading" class="flex flex-col items-center">
        <p class="text-xl">Initializing App</p>
        <p-progressSpinner></p-progressSpinner>
      </div>
      <p-toast></p-toast>
      <p-confirmDialog [style]="{width: '50vw'}"></p-confirmDialog>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
  `],
})
export class AppComponent implements OnInit {
  private publicRoutes: string[] = ['/', '/home', '/about', '/login'];
  public loading: boolean = true;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.loading = true;

          const currentRoute = event.urlAfterRedirects || event.url;
          if (this.publicRoutes.includes(currentRoute)) {
            this.loading = false;
            return;
          }

          // If the user is not authenticated, redirect to login
          if (!this.supabaseService.getToken()) {
            this.router.navigate(['/login']).then(() => {
              this.loading = false;
            });
          } else {
            this.loading = false;
          }
        }
      });
    }
  }
}
