import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import DatabaseService from '@/app/services/database.service';
import { MessageService } from 'primeng/api';
import { TabViewModule } from 'primeng/tabview';

interface IpAddress {
  ip_address: string;
  domains: string[];
}

interface DomainWithIpAddresses {
  domain: string;
  ipAddresses: string[];
}

@Component({
  standalone: true,
  selector: 'app-ip-addresses',
  imports: [CommonModule, PrimeNgModule, TabViewModule],
  templateUrl: './index.page.html',
  styleUrl: './index.page.scss',
})
export default class IpAddressesPageComponent implements OnInit {
  ipv4Addresses: IpAddress[] = [];
  ipv6Addresses: IpAddress[] = [];
  ipv4Domains: DomainWithIpAddresses[] = [];
  ipv6Domains: DomainWithIpAddresses[] = [];
  loadingIpv4: boolean = true;
  loadingIpv6: boolean = true;
  loadingDomains: boolean = true;


  constructor(
    private databaseService: DatabaseService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadIpAddresses();
  }

  loadIpAddresses() {
    this.loadingIpv4 = true;
    this.loadingIpv6 = true;

    this.databaseService.getIpAddresses(false).subscribe({
      next: (addresses) => {
        this.ipv4Addresses = addresses;
        this.loadingIpv4 = false;
        this.ipv4Domains = this.makeDomainsList(addresses);
      },
      error: (error) => {
        console.error('Error fetching IPv4 addresses:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load IPv4 addresses'
        });
        this.loadingIpv4 = false;
      }
    });

    this.databaseService.getIpAddresses(true).subscribe({
      next: (addresses) => {
        this.ipv6Addresses = addresses;
        this.loadingIpv6 = false;
        this.ipv6Domains = this.makeDomainsList(addresses);
      },
      error: (error) => {
        console.error('Error fetching IPv6 addresses:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load IPv6 addresses'
        });
        this.loadingIpv6 = false;
      }
    });
  }

  makeDomainsList(ipAddresses: IpAddress[]): DomainWithIpAddresses[] {
    const results: DomainWithIpAddresses[] = [];
    ipAddresses.forEach((ip) => {
      ip.domains.forEach((domain) => {
        if (!results.find((result) => result.domain === domain)) {
          results.push({ domain, ipAddresses: [ip.ip_address] });
        } else {
          const existingDomain = results.find((result) => result.domain === domain);
          if (existingDomain) {
            existingDomain.ipAddresses.push(ip.ip_address);
          }
        }
      });
    });
    return results;
  }

}
