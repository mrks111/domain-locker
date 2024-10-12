import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { DbDomain } from '@/types/Database';
import DatabaseService from '@/app/services/database.service';
import { MessageService } from 'primeng/api';
import { DomainCollectionComponent } from '@/app/components/domain-collection/domain-collection.component';

@Component({
  standalone: true,
  selector: 'app-ssl-issuer-domains',
  imports: [CommonModule, PrimeNgModule, DomainCollectionComponent],
  template: `
    <h1>Domains using SSL certificates from "{{ issuer }}"</h1>
    <app-domain-view
      [domains]="domains"
      *ngIf="!loading && domains.length > 0"
      [preFilteredText]="'with certificates from '+issuer+''"
      [showAddButton]="false"
    />
    <p-message severity="info" text="No domains found for this SSL issuer." *ngIf="!loading && domains.length === 0"></p-message>
    <p-progressSpinner *ngIf="loading"></p-progressSpinner>
  `,
})
export default class SslIssuerDomainsPageComponent implements OnInit {
  issuer: string = '';
  domains: DbDomain[] = [];
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.issuer = decodeURIComponent(params['issuer']);
      this.loadDomains();
    });
  }

  loadDomains() {
    this.loading = true;
    this.databaseService.getDomainsBySslIssuer(this.issuer).subscribe({
      next: (domains) => {
        this.domains = domains;
        this.loading = false;
        if (domains.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'No Domains',
            detail: `No domains found using SSL certificates from "${this.issuer}"`
          });
        }
      },
      error: (error) => {
        console.error(`Error fetching domains for SSL issuer ${this.issuer}:`, error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load domains for this SSL issuer'
        });
        this.loading = false;
      }
    });
  }
}
