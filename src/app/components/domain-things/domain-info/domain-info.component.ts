import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { DomainUtils } from '@services/domain-utils.service';
import { DlIconComponent } from '@components/misc/svg-icon.component';
import { DomainFaviconComponent } from '@components/misc/favicon.component';
import { type DbDomain } from '@typings/Database';

@Component({
  standalone: true,
  selector: 'app-domain-info',
  imports: [CommonModule, PrimeNgModule, DlIconComponent, DomainFaviconComponent],
  templateUrl: './domain-info.component.html',
})
export class DomainInfoComponent {
  @Input() domain: DbDomain | null = null;

  constructor(public domainUtils: DomainUtils) {}

  public filterIpAddresses(
    ipAddresses: { ip_address: string, is_ipv6: boolean }[] | undefined, isIpv6: boolean
  ): any[] {
    if (!ipAddresses) return [];
    return ipAddresses.filter(ip => ip.is_ipv6 === isIpv6);
  }
}
