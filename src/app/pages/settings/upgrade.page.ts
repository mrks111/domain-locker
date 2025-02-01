import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { BillingService } from '~/app/services/billing.service';
import { pricingFeatures } from '~/app/constants/pricing-features';
import { Observable } from 'rxjs';
import { ErrorHandlerService } from '~/app/services/error-handler.service';

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './upgrade.page.html',
})
export default class UpgradePage implements OnInit {
  currentPlan$: Observable<string | null>;
  public availablePlans = pricingFeatures;
  
  public isAnnual = true;
  public billingCycleOptions = [
    { label: 'Annual', value: true, icon: 'pi pi-calendar-plus' },
    { label: 'Monthly', value: false, icon: 'pi pi-calendar-minus' }
  ];

  constructor(
    private billingService: BillingService,
    private errorHandler: ErrorHandlerService,
  ) {
    this.currentPlan$ = this.billingService.getUserPlan();
  }

  ngOnInit(): void {
    // Ensure the user's current plan is fetched
    this.billingService.fetchUserPlan().catch((error) =>
      console.error('Failed to fetch current plan:', error)
    );
  }

  getStripePlanId(planId: string): string {
    const planMap: { [key: string]: { annual: string; monthly: string } } = {
      free: { annual: '', monthly: '' },
      hobby: { annual: 'dl_hobby_annual', monthly: 'dl_hobby_monthly' },
      pro: { annual: 'dl_pro_annual', monthly: 'dl_pro_monthly' },
    };

    const billingCycle = this.isAnnual ? 'annual' : 'monthly';
    return planMap[planId]?.[billingCycle] || '';
  }

  async handleUpgrade(planId: string): Promise<void> {
    const stripePlanId = this.getStripePlanId(planId);
    if (!stripePlanId) {
      this.errorHandler.handleError({ message: 'Invalid plan ID', showToast: true });
      return;
    }
    try {
      const stripeSession = await this.billingService.createCheckoutSession(stripePlanId);
      console.log('Stripe session:', stripeSession);
      // window.location.href = stripeSession.url;
    } catch (error) {
      this.errorHandler.handleError({ error, message: 'Failed to create Stripe session', showToast: true });
    }
  }

  getPrice(plan: any) {
    return this.isAnnual ? plan.priceAnnual : plan.priceMonth;
  }
}
