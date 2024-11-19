import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { settingsLinks } from '@/app/constants/navigation-links';
import { SupabaseService } from '@/app/services/supabase.service';
import { ProfilePictureComponent } from '@/app/components/misc/profile-picture.component';
import { AccountIssuesComponent } from '@/app/components/settings/account-issues/account-issues.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, PrimeNgModule, ProfilePictureComponent, AccountIssuesComponent],
  templateUrl: './settings/index.page.html',
})
export default class SettingsIndexPage implements OnInit {
  items: MenuItem[] | undefined;
  hideSideBar = false;
  @ViewChild('sidebarNav', { static: false }) sidebarNav!: ElementRef;
  hideTextLabels = false;

  constructor(
    private router: Router,
    public supabaseService: SupabaseService,
  ) {}

  ngOnInit() {
    this.items = settingsLinks;
  }

  isActive(link: string): boolean {
    return this.router.url === link;
  }

  async logout() {
    await this.supabaseService.signOut();
    window.location.href = '/login';
  }
}
