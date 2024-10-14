import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from '@components/navbar/navbar.component';
import { LoadingComponent } from '@components/misc/loading.component';
import { PrimeNgModule } from './prime-ng.module';

import { isPlatformBrowser } from '@angular/common';
import { SupabaseService } from './services/supabase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, PrimeNgModule, CommonModule, LoadingComponent ],
  template: `
    <!-- Navbar -->
    <app-navbar></app-navbar>
    <div class="content-container">
      <!-- While initializing, show loading spinner -->
      <loading *ngIf="loading" />
      <!-- Create router outlet -->
      <router-outlet *ngIf="!loading" />
      <!-- Global components -->
      <p-scrollTop />
      <p-toast />
      <p-confirmDialog />
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
