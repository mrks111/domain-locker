import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subdomain } from '@/types/Database';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { DomainFaviconComponent } from '@components/misc/favicon.component';

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

  makeKVList(sdInfo: any): { key: string; value: string }[] {
    if (!sdInfo) return [];
    const results = [];
    if (sdInfo['type']) results.push({ key: 'Type', value: sdInfo['type'] });
    if (sdInfo['ip']) results.push({ key: 'IP', value: sdInfo['ip'] });
    if (sdInfo['ports'] && sdInfo['ports'].length) {
      results.push({ key: 'Ports', value: sdInfo['ports'].join(', ') });
    }
    if (sdInfo['tags'] && sdInfo['tags'].length) {
      results.push({ key: 'Tags', value: sdInfo['tags'].join(', ') });
    }
    if (sdInfo['asn']) results.push({ key: 'ASN', value: sdInfo['asn'] });
    if (sdInfo['asn_name']) results.push({ key: 'ASN Name', value: sdInfo['asn_name'] });
    if (sdInfo['asn_range']) results.push({ key: 'ASN Range', value: sdInfo['asn_range'] });

    return results;
  }
}
