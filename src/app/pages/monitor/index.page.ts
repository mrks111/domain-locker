import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { FeatureService } from '@/app/services/features.service';
import { FeatureNotEnabledComponent } from '@/app/components/misc/feature-not-enabled.component';

@Component({
  selector: 'app-monitor',
  standalone: true,
  imports: [CommonModule, PrimeNgModule, FeatureNotEnabledComponent],
  templateUrl: './index.page.html',
})
export default class MonitorPage {
  monitorEnabled$ = this.featureService.isFeatureEnabled('domainMonitor');
  
  constructor(private featureService: FeatureService) {}
  
}
