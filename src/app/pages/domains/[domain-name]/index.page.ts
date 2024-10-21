import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PrimeNgModule } from '../../../prime-ng.module';
import DatabaseService from '@services/database.service';
import { type DbDomain } from '@typings/Database';
import { DomainUtils } from '@services/domain-utils.service';
import { DomainFaviconComponent } from '@components/misc/favicon.component'; 
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { DlIconComponent } from '@components/misc/svg-icon.component';
import { LoadingComponent } from '@components/misc/loading.component';
import { GlobalMessageService } from '@services/messaging.service';
import { securityCategories } from '@/app/constants/security-categories';
import { DomainUpdatesComponent } from '@/app/components/domain-things/domain-updates/domain-updates.component';

@Component({
  standalone: true,
  selector: 'app-domain-details',
  imports: [CommonModule, PrimeNgModule, DomainFaviconComponent, DlIconComponent, LoadingComponent, DomainUpdatesComponent ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './domain-name.page.html',
  styleUrl: './domain-name.page.scss',
})
export default class DomainDetailsPage implements OnInit {
  domain: DbDomain | null = null;
  error: string | null = null;
  name: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private messageService: MessageService,
    public domainUtils: DomainUtils,
    private confirmationService: ConfirmationService,
    private router: Router,
    private globalMessageService: GlobalMessageService,
  ) {}

  ngOnInit() {
    this.route.params.pipe(
      switchMap(params => {
        const domainName = params['domain-name'];
        this.name = domainName;
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

  confirmDelete(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to delete this domain?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteDomain();
      }
    });
  }

  deleteDomain() {
    if (!this.domain) return;
    this.databaseService.deleteDomain(this.domain.id).subscribe({
      next: () => {
        this.globalMessageService.showMessage({
          severity: 'success',
          summary: 'Success',
          detail: 'Domain deleted successfully'
        });
        this.router.navigate(['/domains']);
      },
      error: (err) => {
        console.error('Error deleting domain:', err);
        this.globalMessageService.showMessage({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Failed to delete domain'
        });
      }
    });
  }
}
