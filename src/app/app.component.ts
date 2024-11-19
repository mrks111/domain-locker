// Angular
import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

// Dependencies
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { NgApexchartsModule } from 'ng-apexcharts';

// PrimeNG module importing required components
import { PrimeNgModule } from '@/app/prime-ng.module';

// Furniture Components
import { NavbarComponent } from '@/app/components/navbar/navbar.component';
import { FooterComponent } from '@/app/components/footer/footer.component';
import { LoadingComponent } from '@/app/components/misc/loading.component';
import { BreadcrumbsComponent } from '@/app/components/misc/breadcrumbs.component';

// Services
import { ThemeService } from '@/app/services/theme.service';
import { GlobalMessageService } from '@/app/services/messaging.service';
import { SupabaseService } from '@/app/services/supabase.service';
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
    BreadcrumbsComponent,
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
      <breadcrumbs *ngIf="!loading && pagePath" [pagePath]="pagePath" />
      <router-outlet *ngIf="!loading" />
      <!-- Global components -->
      <p-scrollTop />
      <p-toast />
    </div>
    <!-- Footer -->
     <app-footer [big]="isBigFooter" />
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
  public pagePath: string = '';
  public isFullWidth: boolean = false;
  public isBigFooter: boolean = false;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private messageService: MessageService,
    private globalMessageService: GlobalMessageService,
    public _themeService: ThemeService,
    public _hitCountingService: HitCountingService,
    // private _translationService: TranslationService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    // Check auth state
    if (isPlatformBrowser(this.platformId)) {
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.loading = true;

          const currentRoute = event.urlAfterRedirects || event.url;
          this.pagePath = currentRoute;

          this.isFullWidth = this.fullWidthRoutes.some(route => currentRoute.includes(route));

          if (this.publicRoutes.includes(currentRoute) || currentRoute.startsWith('/about')) {
            this.loading = false;
            return; // No auth needed for public routes
          }

          // Auth needed, check if user authenticated, redirect to login if not
          if (!this.supabaseService.getToken()) {
            this.router.navigate(['/login']).then(() => {
              this.loading = false;
              this.isBigFooter = true;
            });
          } else {
            this.loading = false;
          }
        }
      });
    }
    // Initialize the global message service for showing toasts
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
