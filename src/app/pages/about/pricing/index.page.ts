import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { pricingFeatures, selfHostedFeatures, billingFaq } from '@/app/constants/pricing-features';

@Component({
  standalone: true,
  selector: 'app-pricing-page',
  templateUrl: './index.page.html',
  // styleUrls: ['./index.page.css'],
  imports: [CommonModule, PrimeNgModule],
})
export default class PricingPage {
  pricingPlans = pricingFeatures;
  selfHostedFeatures = selfHostedFeatures;
  billingFaq = billingFaq;
  
  isAnnual = true;
  billingCycleOptions = [
    { label: 'Annual', value: true, icon: 'pi pi-calendar-plus' },
    { label: 'Monthly', value: false, icon: 'pi pi-calendar-minus' }
  ];

  toggleBilling() {
    this.isAnnual = !this.isAnnual;
  }

  getPrice(plan: any) {
    return this.isAnnual ? plan.priceAnnual : plan.priceMonth;
  }
}
