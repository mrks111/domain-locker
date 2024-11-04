// src/app/components/navbar/navbar.component.ts
import { Component, OnInit, ChangeDetectorRef, PLATFORM_ID, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { SupabaseService } from '@/app/services/supabase.service';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { RadioButtonModule } from 'primeng/radiobutton';
import { OverlayModule } from 'primeng/overlay';
import { Subscription } from 'rxjs';
import { authenticatedNavLinks, unauthenticatedNavLinks } from '@/app/constants/navigation-links';
import { UiSettingsComponent } from '@components/settings/ui-options.component';

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
    OverlayModule,
    UiSettingsComponent,
  ],
  templateUrl: './navbar.component.html',
  styles: [`
    ::ng-deep .scale-select .p-button {
      justify-content: center;
      width: 100%;
    }
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
export class NavbarComponent implements OnInit {
  items: MenuItem[] = [];
  sidebarVisible: boolean = false;
  settingsVisible: boolean = false;
  isAuthenticated: boolean = false;

  private subscriptions: Subscription = new Subscription();
  private platformId = inject(PLATFORM_ID);

  constructor(
    public supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
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

  async checkAuthStatus() {
    const isAuthenticated = await this.supabaseService.isAuthenticated();
    this.supabaseService.setAuthState(isAuthenticated);
  }

  initializeMenuItems() {
    this.items = [];

    if (this.isAuthenticated) {
      this.items = authenticatedNavLinks;
    } else {
      this.items = unauthenticatedNavLinks;
    }
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
    window.location.href = '/login';
  }
}
