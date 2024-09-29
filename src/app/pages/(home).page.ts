// src/app/pages/home.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../prime-ng.module';

@Component({
  standalone: true,
  imports: [ CommonModule, PrimeNgModule ],
  template: `
<p-card header="Welcome to Domain Locker" subheader="The all-in-one platform for keeping track of domain names">

  <h3>Features</h3>
  <ul class="list-inside pl-0 mt-0 list-none">
    <li *ngFor="let feature of features">
      <i class="mr-2 pi {{feature.icon}}"></i>
      {{ feature.text }}
    </li>
  </ul>

  <ng-template pTemplate="footer">
    <div class="w-full">
      <div class="flex flex-col gap-3 mt-1 md:flex-row md:justify-between">
        <!-- Left container for the first two buttons on larger screens -->
        <div class="flex flex-col gap-3 w-full md:w-2/3 md:flex-row">
          <p-button 
            label="View on GitHub" 
            severity="secondary" 
            icon="pi pi-github" 
            class="min-w-48" 
            styleClass="w-full" 
          />
          <p-button 
            label="Self-Hosting" 
            severity="secondary" 
            icon="pi pi-server" 
            class="min-w-48" 
            styleClass="w-full" 
          />
        </div>
        <!-- Right container for the final button on larger screens -->
        <div class="flex w-full md:w-1/3 justify-end  flex-col gap-3 w-full md:flex-row">
          <p-button 
            label="Get Started" 
            class="min-w-48" 
            icon="pi pi-arrow-circle-right" 
            styleClass="w-full" 
          />
        </div>
      </div>
    </div>
  </ng-template>
</p-card>
  `,
})
export default class HomePageComponent {
  features = [
    { icon: 'pi-chart-line', text: 'Keep track of all your domains in a simple dashboard' },
    { icon: 'pi-lock', text: 'Check security and privacy configurations for each domain' },
    { icon: 'pi-send', text: 'Get notified of upcoming domain expirations or config updates' },
    { icon: 'pi-wave-pulse', text: 'Monitor changes in name servers, DNS, WhoIs and more' },
    { icon: 'pi-sparkles', text: 'Easy data import and export, no vendor lock-in' },
  ];
}
