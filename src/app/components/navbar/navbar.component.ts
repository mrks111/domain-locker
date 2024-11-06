// src/app/components/navbar/navbar.component.ts
import { Component, OnInit, ChangeDetectorRef, PLATFORM_ID, inject, ViewChild, AfterViewInit } from '@angular/core';
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
import { NotificationsListComponent } from '@components/notifications-list/notifications-list.component';
import { OverlayPanel } from 'primeng/overlaypanel';
import DatabaseService from '@/app/services/database.service';

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
    NotificationsListComponent,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, AfterViewInit {
  @ViewChild('notificationsOverlay') notificationsOverlay!: OverlayPanel;
  notificationsVisible: boolean = false;
  items: MenuItem[] = [];
  sidebarVisible: boolean = false;
  settingsVisible: boolean = false;
  isAuthenticated: boolean = false;
  unreadNotificationsCount: number = 0;

  private subscriptions: Subscription = new Subscription(); 
  private platformId = inject(PLATFORM_ID);

  constructor(
    public supabaseService: SupabaseService,
    private databaseService: DatabaseService,
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

  ngAfterViewInit() {
    this.loadUnreadNotificationCount();
  }

  loadUnreadNotificationCount() {
    this.databaseService.getUnreadNotificationCount().subscribe(
      (count) => this.unreadNotificationsCount = count,
    );
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
  
  toggleNotifications(event: Event) {
    this.notificationsVisible = true;
    this.notificationsOverlay.toggle(event);
    this.unreadNotificationsCount = 0;
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
