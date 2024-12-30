import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import DatabaseService from '@/app/services/database.service';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { ErrorHandlerService } from '@/app/services/error-handler.service';
import { makeKVList } from './../subdomain-utils';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DomainInfoComponent } from '@/app/components/domain-things/domain-info/domain-info.component';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { DbDomain } from '@/types/Database';
import { DomainUtils } from '@services/domain-utils.service';
import { NotFoundComponent } from '@components/misc/domain-not-found.component';

@Component({
  standalone: true,
  selector: 'app-subdomain-detail',
  imports: [CommonModule, PrimeNgModule, DomainInfoComponent, NotFoundComponent],
  templateUrl: './[subdomain].page.html',
})
export default class SubdomainDetailPageComponent implements OnInit {
  domain: string = '';
  subdomainName: string = '';
  subdomainInfo: { key: string; value: string }[] = [];
  subdomain: any = null;
  loading: boolean = true;
  subdomainWebsiteInfo: DbDomain | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private domainUtils: DomainUtils,
    private messageService: MessageService,
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    // Get parent domain and subdomain name from URL params
    this.domain = this.route.snapshot.params['domain'];
    this.subdomainName = this.route.snapshot.params['subdomain'];
    // Load subdomain info from db
    this.loadSubdomain();
    // Fetch live data about the website
    this.loadDomainInfo();
  }

  loadSubdomain() {
    this.loading = true;
    this.databaseService.subdomainsQueries
      .getSubdomainInfo(this.domain, this.subdomainName)
      .subscribe({
        next: (subdomain) => {
          this.subdomain = subdomain;
          this.subdomainInfo = makeKVList(subdomain.sd_info);
          this.loading = false;
        },
        error: (error) => {
          this.errorHandler.handleError({ error });
          this.loading = false;
        },
      });
  }

  private async loadDomainInfo(): Promise<void> {
    const domainName = this.subdomainName + '.' + this.domain;
    console.log(domainName);
    this.http.get<{ domainInfo: DbDomain}>(`/api/domain-info?domain=${domainName}`).pipe(
        catchError((error) => { throw error })
      ).subscribe({
        next: async (fetchedDomainInfo) => {
          const results = { ...fetchedDomainInfo.domainInfo };
          this.subdomainWebsiteInfo = results;
          console.log(this.subdomainWebsiteInfo);
        },
        error: (error) => {
          this.errorHandler.handleError({
            error,
            message: 'Failed to determine additional subdomain info',
            showToast: true,
          });
        }
      });
    }


    confirmDelete(): void {
      this.confirmationService.confirm({
        message: `Are you sure you want to delete the subdomain "${this.subdomainName}.${this.domain}"?`,
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.databaseService.subdomainsQueries
            .deleteSubdomain(this.domain, this.subdomainName)
            .then(() => {
              this.messageService.add({
                severity: 'success',
                summary: 'Deleted',
                detail: `Subdomain "${this.subdomainName}.${this.domain}" has been deleted successfully.`,
              });
              this.router.navigate(['/assets/subdomains', this.domain]);
            })
            .catch((error) => {
              this.errorHandler.handleError({
                error,
                showToast: true,
                message: 'Failed to delete the subdomain. Please try again.',
              });
            });
        },
        reject: () => {
          this.messageService.add({
            severity: 'info',
            summary: 'Cancelled',
            detail: 'Deletion cancelled',
          });
        },
      });
    }

}



