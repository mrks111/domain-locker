import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import DatabaseService from '@services/database.service';
import { NgIf, NgFor } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';

@Component({
  standalone: true,
  selector: 'app-domain-updates',
  templateUrl: './domain-updates.component.html',
  styleUrls: ['./domain-updates.component.scss'],
  imports: [NgIf, NgFor, PrimeNgModule, CommonModule],
})
export class DomainUpdatesComponent implements OnInit {
  @Input() domainName?: string;
  public updates$: Observable<any[]> | undefined;
  public loading = true;

  constructor(private databaseService: DatabaseService) {}

  ngOnInit(): void {
    this.fetchUpdates();
  }

  private fetchUpdates() {
    this.loading = true;
    this.updates$ = this.databaseService.getDomainUpdates(this.domainName);
    this.loading = false;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  mapChangeKey(key: string): string {
    switch (key) {
      case 'dates_expiry':
        return 'Expiry Date';
      case 'dates_updated':
        return 'Update Date';
      case 'domain_name':
        return 'Domain Name';
      case 'ip_ipv4':
        return 'IPv4';
      case 'ip_ipv6':
        return 'IPv6';
      case 'dns_mx':
        return 'MX record';
      case 'dns_ns':
        return 'Name Server';
      case 'dns_txt':
        return 'TXT record';
      case 'whois_postal_code':
        return 'Postal Code';
      case 'whois_name':
        return 'Registrant Name';
      case 'ssl_issuer':
        return 'SSL Issuer';
      case 'domain_statuses':
        return 'Status';
      default:
        return key;
    }
  }
}
