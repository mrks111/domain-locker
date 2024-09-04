// src/app/components/navbar/navbar.component.ts
import { Component, OnInit } from '@angular/core';
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
  `]
})
export class NavbarComponent implements OnInit {
  items: MenuItem[] = [];
  sidebarVisible: boolean = false;
  settingsVisible: boolean = false;
  isDarkTheme: boolean = false;
  selectedTheme: Theme;
  themes: Theme[];
  darkModeOptions = [
    { label: 'Light', value: false, icon: 'pi pi-sun' },
    { label: 'Dark', value: true, icon: 'pi pi-moon' }
  ];

  constructor(
    public supabaseService: SupabaseService,
    private themeService: ThemeService
  ) {
    this.themes = this.themeService.getThemes();
    this.selectedTheme = this.themes[0];
  }

  ngOnInit() {
    this.initializeMenuItems();
    this.themeService.isDarkTheme$.subscribe(isDark => this.isDarkTheme = isDark);
    this.themeService.selectedTheme$.subscribe(theme => this.selectedTheme = theme);
  }

  initializeMenuItems() {
    this.items = [
      {
        label: 'Home',
        icon: 'pi pi-fw pi-home',
        routerLink: '/'
      },
      {
        label: 'Domains',
        icon: 'pi pi-fw pi-globe',
        routerLink: '/domains'
      },
      {
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
      },
    ];
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
}
