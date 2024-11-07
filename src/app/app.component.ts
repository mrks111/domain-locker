import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from '@components/navbar/navbar.component';
import { FooterComponent } from '@components/footer/footer.component';
import { LoadingComponent } from '@components/misc/loading.component';
import { PrimeNgModule } from './prime-ng.module';
import { GlobalMessageService } from '@services/messaging.service';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseService } from './services/supabase.service';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ThemeService } from './services/theme.service';

import { HitCountingService } from '@/app/services/hit-counting.service';
import { ErrorHandlerService } from '@/app/services/error-handler.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    PrimeNgModule,
    NgApexchartsModule,
    CommonModule,
    NavbarComponent,
    FooterComponent,
    LoadingComponent,
  ],
  providers: [MessageService, ErrorHandlerService],
  template: `
    <!-- Navbar -->
    <app-navbar />
    <!-- Main content container -->
    <div class="content-container" [ngClass]="{ 'full': isFullWidth }">
      <!-- While initializing, show loading spinner -->
      <loading *ngIf="loading" />
      <!-- Create router outlet -->
      <router-outlet *ngIf="!loading" />
      <!-- Global components -->
      <p-scrollTop />
      <p-toast />
    </div>
    <!-- Footer -->
     <app-footer />
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    ::ng-deep app-root {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  private subscription: Subscription | undefined;
  private publicRoutes: string[] = ['/', '/home', '/about', '/login'];
  private fullWidthRoutes: string[] = ['/settings', '/stats'];

  public loading: boolean = true;
  public isFullWidth: boolean = false;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private messageService: MessageService,
    private globalMessageService: GlobalMessageService,
    private _themeService: ThemeService,
    private hitCountingService: HitCountingService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.loading = true;

          const currentRoute = event.urlAfterRedirects || event.url;

          this.isFullWidth = this.fullWidthRoutes.some(route => currentRoute.includes(route));

          if (this.publicRoutes.includes(currentRoute) || currentRoute.startsWith('/about')) {
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
    this.subscription = this.globalMessageService.getMessage().subscribe(message => {
      if (message) {
        this.messageService.add(message);
      } else {
        this.messageService.clear();
      }
    });
  }
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
