import { RouterOutlet } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { PrimeNgModule } from '../../prime-ng.module';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, PrimeNgModule],
  selector: 'stats-index-page',
  // templateUrl: './index.page.html',
  template: `
  <div class="mx-auto mt-6 w-4/5">
    <h2 class="text-4xl">Domain Statistics</h2>
    <p class="italic text-xl opacity-70">
      Explore an in-depth view of your domain data with interactive charts and insights.
      Use the options on the left to visualize everything from domain providers and
      security profiles to SSL lifespans and upcoming expirations.
    </p>
    <i class="text-9xl text-center w-full mx-auto mt-8 text-primary opacity-20 pi pi-sparkles"></i>
  </div>
  `,
})
export default class StatsIndexPage  {
  items: MenuItem[] | undefined;
  constructor() {}

}

