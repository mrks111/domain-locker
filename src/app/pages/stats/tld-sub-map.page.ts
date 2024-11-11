import { Component } from '@angular/core';
import { TldOrganizationChartComponent } from '@components/charts/domain-hierarchy/domain-hierarchy.component';


@Component({
  standalone: true,
  template: `
    <h1 class="mt-2 mb-4">TLD and Subdomain Hierarchy</h1>
    <app-tld-organization-chart />
  `,
  imports: [TldOrganizationChartComponent],
  styles: ['']
})
export default class HostMapPage {}

