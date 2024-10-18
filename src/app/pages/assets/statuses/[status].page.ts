import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { DbDomain } from '@/types/Database';
import DatabaseService from '@/app/services/database.service';
import { MessageService } from 'primeng/api';
import { DomainCollectionComponent } from '@components/domain-collection/domain-collection.component';

@Component({
  standalone: true,
  selector: 'app-status-domains',
  imports: [CommonModule, PrimeNgModule, DomainCollectionComponent],
  template: `
    <h1>Domains with status "{{ statusCode }}"</h1>
    <app-domain-view
    [domains]="domains"
    [preFilteredText]="'with status '+statusCode+''"
    [showAddButton]="false"
    *ngIf="!loading" />
    <p-progressSpinner *ngIf="loading"></p-progressSpinner>
  `,
})
export default class StatusDomainsPageComponent implements OnInit {
  statusCode: string = '';
  domains: DbDomain[] = [];
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.statusCode = params['status'];
      this.loadDomains();
    });
  }

  loadDomains() {
    this.loading = true;
    this.databaseService.getDomainsByStatus(this.statusCode).subscribe({
      next: (domains) => {
        this.domains = domains;
        this.loading = false;
      },
      error: (error) => {
        console.error(`Error fetching domains for status ${this.statusCode}:`, error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load domains for this status'
        });
        this.loading = false;
      }
    });
  }
}
