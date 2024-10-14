// src/app/components/navbar/navbar.component.ts
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../prime-ng.module';
import { SupabaseService } from '../../services/supabase.service';
import { ThemeService, Theme } from '../../services/theme.service';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { RadioButtonModule } from 'primeng/radiobutton';
import { OverlayModule } from 'primeng/overlay';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PrimeNgModule,
    FormsModule,
    SelectButtonModule,
    RadioButtonModule,
    OverlayModule
  ],
  templateUrl: './navbar.component.html',
  styles: [`
    ::ng-deep .custom-menubar .p-menubar-root-list {
      display: flex;
      align-items: center;
    }
    ::ng-deep .custom-menubar .p-menuitem-link {
      padding: 0.5rem 0.75rem;
    }
    ::ng-deep .custom-menubar .p-menuitem-icon {
      margin-right: 0.5rem;
    }
    ::ng-deep .p-sidebar {
      max-width: 100%;
    }
    ::ng-deep .settings-overlay .p-selectbutton .p-button {
      padding: 0.5rem;
    }
    ::ng-deep p-menubar {
      display: flex;
    }
    .logged-in-options-wrap {
      @apply flex items-center flex-col;
      a, button {
        @apply flex items-center w-full flex justify-center my-1;
      }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  items: MenuItem[] = [];
  sidebarVisible: boolean = false;
  settingsVisible: boolean = false;
  isDarkTheme: boolean = false;
  isAuthenticated: boolean = false;
  selectedTheme: Theme;
  themes: Theme[];
  darkModeOptions = [
    { label: 'Light', value: false, icon: 'pi pi-sun' },
    { label: 'Dark', value: true, icon: 'pi pi-moon' }
  ];

  private subscriptions: Subscription = new Subscription();

  constructor(
    public supabaseService: SupabaseService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef,
  ) {
    this.themes = this.themeService.getThemes();
    this.selectedTheme = this.themes[0];
  }

  ngOnInit() {
    this.subscriptions.add(
      this.themeService.isDarkTheme$.subscribe(isDark => {
        this.isDarkTheme = isDark;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.themeService.selectedTheme$.subscribe(theme => {
        this.selectedTheme = theme;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.supabaseService.authState$.subscribe(isAuthenticated => {
        this.isAuthenticated = isAuthenticated;
        this.initializeMenuItems();
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

  initializeMenuItems() {
    this.items = [];

    if (this.isAuthenticated) {
      this.items = [
        {
          label: 'Domains',
          icon: 'pi pi-fw pi-globe',
          routerLink: '/domains',
          items: [
            {
              label: 'Inventory',
              icon: 'pi pi-briefcase',
              routerLink: '/domains',
            },
            {
              label: 'Add Domain',
              icon: 'pi pi-fw pi-plus',
              routerLink: '/domains/add'
            },
            {
              label: 'Bulk Import',
              icon: 'pi pi-fw pi-file-import',
              routerLink: '/domains/add/bulk-add'
            },
          ],
        },
        {
          label: 'Assets',
          icon: 'pi pi-box',
          routerLink: '/assets',
          items: [
            {
              label: 'Registrars',
              icon: 'pi pi-fw pi-receipt',
              routerLink: '/assets/registrars',
            },
            {
              label: 'Hosts',
              icon: 'pi pi-fw pi-server',
              routerLink: '/assets/hosts',
            },
            {
              label: 'Certificates',
              icon: 'pi pi-fw pi-key',
              routerLink: '/assets/certs',
            },
            {
              label: 'IPs',
              icon: 'pi pi-fw pi-sitemap',
              routerLink: '/assets/ips',
            },
            {
              label: 'Tags',
              icon: 'pi pi-fw pi-tag',
              routerLink: '/assets/tags',
            },
            {
              label: 'DNS',
              icon: 'pi pi-fw pi-table',
              routerLink: '/assets/dns',
            },
          ],
        },
        {
          label: 'Statistics',
          icon: 'pi pi-fw pi-wave-pulse',
          routerLink: '/stats',
          items: [
            {
              label: 'Timeline',
              icon: 'pi pi-calendar',
              routerLink: '/stats/timeline',
            },
            {
              label: 'Map',
              icon: 'pi pi-map-marker',
              routerLink: '/stats/map',
            },
          ],
        },
        // {
        //   label: 'Reports',
        //   icon: 'pi pi-fw pi-chart-line',
        //   routerLink: '/notifications'
        // },
        // {
        //   label: 'Data Export',
        //   icon: 'pi pi-fw pi-file-export',
        //   routerLink: '/export'
        // },
        // {
        //   label: 'Change History',
        //   icon: 'pi pi-fw pi-history',
        //   routerLink: '/history'
        // },
        // {
        //   label: 'Notifications',
        //   icon: 'pi pi-fw pi-bell',
        //   routerLink: '/notifications'
        // }
      ];
    } else {
      this.items.push({
        label: 'About',
        icon: 'pi pi-fw pi-info-circle',
        items: [
          {
            label: 'Overview',
            routerLink: '/about'
          },
          {
            label: 'Pricing',
            routerLink: '/about/pricing'
          },
        ],
      });
      this.items.push({
        label: 'Login',
        icon: 'pi pi-fw pi-sign-in',
        routerLink: '/login'
      });
    }
  }

  onDarkModeChange() {
    this.themeService.toggleDarkMode();
  }

  onThemeChange(theme: Theme) {
    this.themeService.setTheme(theme);
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar() {
    this.sidebarVisible = false;
  }

  toggleSettings(event: Event) {
    this.settingsVisible = !this.settingsVisible;
    event.preventDefault();
  }

  async signOut() {
    await this.supabaseService.signOut();
    // redirect to /login
    window.location.href = '/login';
  }
}
