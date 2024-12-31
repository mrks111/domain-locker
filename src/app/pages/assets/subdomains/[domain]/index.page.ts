import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SubdomainListComponent } from './../subdomain-list.component';
import DatabaseService from '@/app/services/database.service';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { ErrorHandlerService } from '@/app/services/error-handler.service';
import { NotFoundComponent } from '@components/misc/domain-not-found.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-subdomains-domain',
  imports: [CommonModule, SubdomainListComponent, PrimeNgModule, NotFoundComponent],
  providers: [MessageService],
  template: `
    <!-- Heading -->
    <h1>Subdomains for {{ domain }}</h1>
    <!-- Loading spinner -->
    <p-progressSpinner *ngIf="loading"></p-progressSpinner>
    <!-- Results -->
    <app-subdomain-list
      *ngIf="!loading && subdomains.length"
      [domain]="domain"
      [subdomains]="subdomains"
    ></app-subdomain-list>
    <!-- Not found message -->
    <app-not-found
      *ngIf="!loading && !subdomains.length"
      title="No Subdomains Found"
      [name]="this.domain"
      message="either doesn't exist or hasn't yet got any associated subdomains"
      actionLabel="Edit Domain"
      actionIcon="pi pi-pencil"
      actionLink="/domains/{{ domain }}/edit"
    >
      <p-button
        *ngIf="validDomain"
        label="Search for Subdomains"
        icon="pi pi-search"
        class="p-button-secondary mt-4"
        (click)="searchForSubdomains()"
      ></p-button>
    </app-not-found>
  `,
})
export default class SubdomainsDomainPageComponent implements OnInit {
  domain: string = '';
  subdomains: any[] = [];
  loading: boolean = true;
  validDomain: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService,
    private http: HttpClient,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.domain = this.route.snapshot.params['domain'];
    this.loadSubdomains();
  }

  loadSubdomains() {
    this.loading = true;
    this.databaseService.subdomainsQueries.getSubdomainsByDomain(this.domain).subscribe({
      next: (subdomains) => {
        this.subdomains = subdomains.map((sd) => ({
          ...sd,
          sd_info: typeof sd.sd_info === 'string' ? this.parseSdInfo(sd.sd_info) : sd.sd_info,
        }));
        this.validDomain = true;
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.handleError({ error });
        this.validDomain = false;
        this.loading = false;
      },
    });
  }

  async searchForSubdomains() {
    try {
      this.loading = true;
      const response: any[] | undefined = await firstValueFrom(
        this.http.get<any[]>(`/api/domain-subs?domain=${this.domain}`)
      );

      // Filter out subdomains with invalid names
      const validSubdomains = (response || []).filter(sd => sd.name?.trim());
      if (validSubdomains.length > 0) {
        await this.databaseService.subdomainsQueries.saveSubdomainsForDomainName(this.domain, validSubdomains);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Subdomains successfully added.',
        });
        this.loadSubdomains(); // Reload subdomains
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'No Valid Subdomains Found',
          detail: 'No valid subdomains were discovered for this domain.',
        });
      }
    } catch (error) {
      this.errorHandler.handleError({ error, message: 'Failed to search for subdomains.' });
    } finally {
      this.loading = false;
    }
  }


  private parseSdInfo(sdInfo: string): any {
    try {
      return JSON.parse(sdInfo);
    } catch (error) {
      this.errorHandler.handleError({ error, message: 'Failed to parse subdomain info.' });
      return null;
    }
  }
}
