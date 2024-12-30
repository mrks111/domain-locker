import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SubdomainListComponent } from './../subdomain-list.component';
import DatabaseService from '@/app/services/database.service';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { ErrorHandlerService } from '@/app/services/error-handler.service';
import { NotFoundComponent } from '@components/misc/domain-not-found.component';

@Component({
  standalone: true,
  selector: 'app-subdomains-domain',
  imports: [CommonModule, SubdomainListComponent, PrimeNgModule, NotFoundComponent],
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
    />
  `,
})
export default class SubdomainsDomainPageComponent implements OnInit {
  domain: string = '';
  subdomains: any[] = [];
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit() {
    this.domain = this.route.snapshot.params['domain'];
    this.loadSubdomains();
    console.log(this.route.snapshot.params);
  }

  loadSubdomains() {
    this.loading = true;
    this.databaseService.subdomainsQueries.getSubdomainsByDomain(this.domain).subscribe({
      next: (subdomains) => {
        subdomains.forEach((sd) => {
          if (sd.sd_info && typeof sd.sd_info === 'string') {
            try {
              sd.sd_info = JSON.parse(sd.sd_info);
            } catch (error) {
              this.errorHandler.handleError({ error, message: 'Failed to parse subdomain info' });
            }
          }
        });
        this.subdomains = subdomains;
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.handleError({ error });
        this.loading = false;
      },
    });
  }
}
