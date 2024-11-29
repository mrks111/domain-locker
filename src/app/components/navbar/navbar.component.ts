// src/app/components/navbar/navbar.component.ts
import { Component, OnInit, ChangeDetectorRef, PLATFORM_ID, inject, ViewChild, AfterViewInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { EventType, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { SupabaseService } from '@/app/services/supabase.service';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { RadioButtonModule } from 'primeng/radiobutton';
import { OverlayModule } from 'primeng/overlay';
import { Subscription } from 'rxjs';
import { authenticatedNavLinks, unauthenticatedNavLinks, settingsLinks } from '@/app/constants/navigation-links';
import { UiSettingsComponent } from '@/app/components/settings/ui-options/ui-options.component';
import { NotificationsListComponent } from '@components/notifications-list/notifications-list.component';
import { OverlayPanel } from 'primeng/overlaypanel';
import DatabaseService from '@/app/services/database.service';
import { BillingService, UserType } from '@/app/services/billing.service';
import { EnvironmentType, EnvService } from '@/app/services/environment.service';

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
  itemsWithSettings: MenuItem[] = [];
  sidebarVisible: boolean = false;
  settingsVisible: boolean = false;
  isAuthenticated: boolean = false;
  unreadNotificationsCount: number = 0;
  userPlan: EnvironmentType | UserType | null = null;
  planColor: string = 'primary';

  private subscriptions: Subscription = new Subscription(); 
  private platformId = inject(PLATFORM_ID);

  constructor(
    public supabaseService: SupabaseService,
    private databaseService: DatabaseService,
    private billingService: BillingService,
    private environmentService: EnvService,
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
    this.loadUserPlanEnvironment();
  }

  loadUserPlanEnvironment() {
    if (isPlatformBrowser(this.platformId)) {
      const environmentType = this.environmentService.getEnvironmentType();
      if (environmentType === 'managed') {
      this.billingService.getUserPlan().subscribe(plan => {
        this.userPlan = plan || 'free';
      });
      } else {
      this.userPlan = environmentType;
      }
      if (this.userPlan) this.planColor = this.getColorForPlan(this.userPlan);
      this.cdr.detectChanges();
    }
  }

  getColorForPlan(plan: EnvironmentType | UserType): string {
    switch (plan) {
      case 'free':
        return 'cyan';
      case 'hobby':
        return 'green';
      case 'pro':
        return 'blue';
      case 'sponsor':
        return 'pink';
      case 'enterprise':
        return 'blue';
      case 'tester':
        return 'red';
      case 'super':
        return 'indigo';
      case 'self-hosted':
        return 'teal';
      case 'demo':
        return 'orange';
      case 'dev':
        return 'purple';
      default:
        return 'primary';
    }
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
      this.itemsWithSettings = [
        ...authenticatedNavLinks,
        { label: 'Settings', routerLink: '/settings', icon: 'pi pi-wrench',  items: settingsLinks },
      ];
    } else {
      this.items = unauthenticatedNavLinks;
      this.itemsWithSettings = unauthenticatedNavLinks;
    }
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar() {
    this.sidebarVisible = false;
    this.cdr.detectChanges();
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
