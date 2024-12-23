import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import DatabaseService from '@/app/services/database.service';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { ErrorHandlerService } from '@/app/services/error-handler.service';

@Component({
  standalone: true,
  selector: 'app-subdomain-detail',
  imports: [CommonModule, PrimeNgModule],
  template: `
    <h1>{{ subdomain?.name || 'Subdomain Details' }}</h1>
    <p-progressSpinner *ngIf="loading"></p-progressSpinner>
    <div *ngIf="!loading && subdomain">
      <pre>{{ subdomain.sd_info | json }}</pre>
    </div>
    <p *ngIf="!loading && !subdomain">Subdomain not found.</p>
  `,
})
export default class SubdomainDetailPageComponent implements OnInit {
  domain: string = '';
  subdomainName: string = '';
  subdomain: any = null;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit() {
    this.domain = this.route.snapshot.params['domain'];
    this.subdomainName = this.route.snapshot.params['subdomain'];
    this.loadSubdomain();
  }

  loadSubdomain() {
    this.loading = true;
    this.databaseService.subdomainsQueries
      .getSubdomainInfo(this.domain, this.subdomainName)
      .subscribe({
        next: (subdomain) => {
          this.subdomain = subdomain;
          this.loading = false;
        },
        error: (error) => {
          this.errorHandler.handleError({ error });
          this.loading = false;
        },
      });
  }
}
