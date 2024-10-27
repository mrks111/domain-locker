import { Component } from '@angular/core';
import { DomainPieChartsComponent } from '@components/charts/domain-pie/domain-pie.component';

@Component({
  standalone: true,
  selector: 'app-index-page',
  template: '<h1>Domain Providers</h1><app-domain-pie-charts />',
  imports: [DomainPieChartsComponent],
})
export default class DomainProvidersPage {}
