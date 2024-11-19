import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { AccountIssuesComponent } from '@/app/components/settings/account-issues/account-issues.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.page.html',
  imports: [CommonModule, PrimeNgModule, AccountIssuesComponent]
})
export default class SettingsPage  {}
