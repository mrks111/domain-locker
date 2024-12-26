import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SubdomainListComponent } from './../subdomain-list.component';
import DatabaseService from '@/app/services/database.service';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { ErrorHandlerService } from '@/app/services/error-handler.service';

@Component({
  standalone: true,
  selector: 'app-subdomains-domain',
  imports: [CommonModule, SubdomainListComponent, PrimeNgModule],
  template: `
    <h1>Subdomains for {{ domain }}</h1>
    <p-progressSpinner *ngIf="loading"></p-progressSpinner>
    <app-subdomain-list
      *ngIf="!loading && subdomains.length"
      [domain]="domain"
      [subdomains]="subdomains"
    ></app-subdomain-list>
    <p *ngIf="!loading && !subdomains.length">No subdomains found for this domain.</p>
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
