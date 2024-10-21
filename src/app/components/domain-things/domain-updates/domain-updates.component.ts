import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import DatabaseService from '@services/database.service';
import { NgIf, NgFor } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  standalone: true,
  selector: 'app-domain-updates',
  templateUrl: './domain-updates.component.html',
  styleUrls: ['./domain-updates.component.scss'],
  imports: [NgIf, NgFor, PrimeNgModule, PaginatorModule, CommonModule],
})
export class DomainUpdatesComponent implements OnInit {
  @Input() domainName?: string;
  public updates$: Observable<any[]> | undefined;
  public loading = true;
  public totalRecords: number = 0;
  public currentPage: number = 0;

  constructor(private databaseService: DatabaseService) {}

  ngOnInit(): void {
    this.fetchTotalCount();
    this.fetchUpdates(this.currentPage);
  }

  private fetchUpdates(page: number) {
    this.loading = true;
    const limit = 25;
    const from = page * limit;
    const to = from + limit - 1;
    
    this.databaseService.getDomainUpdates(this.domainName, from, to).subscribe({
      next: (updates) => {
        this.updates$ = of(updates);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching domain updates:', error);
        this.loading = false;
      }
    });
  }
  

  private fetchTotalCount() {
    this.databaseService.getTotalUpdateCount(this.domainName).subscribe({
      next: (total) => {
        this.totalRecords = total;
      },
      error: (error) => {
        console.error('Error fetching total updates count:', error);
      }
    });
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.fetchUpdates(this.currentPage);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
