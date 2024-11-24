import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { AccountIssuesComponent } from '@/app/components/settings/account-issues/account-issues.component';
import { BillingService } from '@/app/services/billing.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.page.html',
  imports: [CommonModule, PrimeNgModule, AccountIssuesComponent],
})
export default class SettingsPage implements OnInit {
  currentPlan$: Observable<string | null>;

  constructor(private billingService: BillingService) {
    this.currentPlan$ = this.billingService.getUserPlan();
  }

  ngOnInit(): void {
    // Fetch the user's current plan
    this.billingService.fetchUserPlan().catch((error) => {
      console.error('Failed to fetch user plan:', error);
    });
  }
}
