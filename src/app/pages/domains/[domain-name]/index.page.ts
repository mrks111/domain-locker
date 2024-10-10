import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PrimeNgModule } from '../../../prime-ng.module';
import DatabaseService from '@services/database.service';
import { type DbDomain } from '@typings/Database';
import { DomainUtils } from '@services/domain-utils.service';
import { DomainFaviconComponent } from '@components/misc/favicon.component'; 
import { MessageService } from 'primeng/api';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { DlIconComponent } from '@components/misc/svg-icon.component';

@Component({
  standalone: true,
  selector: 'app-domain-details',
  imports: [CommonModule, PrimeNgModule, DomainFaviconComponent, DlIconComponent ],
  templateUrl: './domain-name.page.html',
  styleUrl: './domain-name.page.scss',
})
export default class DomainDetailsPage implements OnInit {
  domain: DbDomain | null = null;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private messageService: MessageService,
    public domainUtils: DomainUtils,
  ) {}

  ngOnInit() {
    this.route.params.pipe(
      switchMap(params => {
        const domainName = params['domain-name'];
        return this.databaseService.getDomain(domainName).pipe(
          catchError(error => {
            this.error = error.message;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to load domain details: ${error.message}`
            });
            return of(null);
          })
        );
      })
    ).subscribe(domain => {
      this.domain = domain;
    });
  }

  public filterIpAddresses(ipAddresses: { ip_address: string, is_ipv6: boolean }[] | undefined, isIpv6: boolean): any[] {
    if (!ipAddresses) return [];
    return ipAddresses.filter(ip => ip.is_ipv6 === isIpv6);
  }
}
