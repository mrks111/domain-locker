import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subdomain } from '@/types/Database';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { DomainFaviconComponent } from '@components/misc/favicon.component';
import { makeKVList } from './subdomain-utils';

@Component({
  standalone: true,
  selector: 'app-subdomain-list',
  imports: [CommonModule, RouterModule, PrimeNgModule, DomainFaviconComponent],
  template: `
    <ul class="list-none p-0 m-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <li *ngFor="let subdomain of subdomains" class="p-card px-4 py-3 rounded shadow">
        <a
          [routerLink]="['/assets/subdomains', domain, subdomain.name]"
          class="text-primary no-underline hover:underline"
        >
          <h3 class="text-lg font-bold text-default truncate">
            <app-domain-favicon [domain]="subdomain.name + '.' + domain" [size]="24" class="mr-2" />
            <span class="text-primary">{{ subdomain.name }}</span>
            <span>.</span>
            <span>{{ domain }}</span>
          </h3>
        </a>
        <ul *ngFor="let item of makeKVList(subdomain.sd_info)"
          class="m-0 p-0 list-none text-sm text-surface-500 opacity-90">
          <li class="truncate">
            <strong class="font-semibold">{{ item.key }}</strong>: {{ item.value }}
          </li>
        </ul>
      </li>
    </ul>
  `,
})
export class SubdomainListComponent {
  @Input() domain: string = '';
  @Input() subdomains: Subdomain[] = [];
  makeKVList = makeKVList;
}
