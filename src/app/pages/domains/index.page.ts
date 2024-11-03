import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../prime-ng.module';
import DatabaseService from '@services/database.service';
import { DbDomain } from '@/types/Database';
import { MessageService } from 'primeng/api';
import { DomainCollectionComponent } from '@components/domain-things/domain-collection/domain-collection.component';
import { LoadingComponent } from '@components/misc/loading.component';

@Component({
  standalone: true,
  selector: 'domain-all-page',
  imports: [DomainCollectionComponent, PrimeNgModule, CommonModule, LoadingComponent],
  template: `
    <app-domain-view 
      *ngIf="!loading; else loadingTemplate" 
      [domains]="domains"
    ></app-domain-view>
    <ng-template #loadingTemplate>
      <loading loadingTitle="Loading" loadingDescription="Fetching domains from database" />
    </ng-template>
  `,
})
export default class DomainAllPageComponent implements OnInit {
  domains: DbDomain[] = [];
  loading: boolean = true;

  constructor(private databaseService: DatabaseService, private messageService: MessageService) {}

  ngOnInit() {
    this.loadDomains();
  }

  loadDomains() {
    this.loading = true;
    this.databaseService.listDomains().subscribe({
      next: (domains) => {
        this.domains = domains;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching domains:', error);
        this.loading = false;
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Couldn\'t fetch domains from database' 
        });
      }
    });
  }
}
