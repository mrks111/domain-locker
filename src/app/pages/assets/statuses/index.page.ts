import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PrimeNgModule } from '@/app/prime-ng.module';
import DatabaseService from '@/app/services/database.service';
import { MessageService } from 'primeng/api';

@Component({
  standalone: true,
  selector: 'app-statuses-index',
  imports: [CommonModule, RouterModule, PrimeNgModule],
  template: `
    <h1 class="mt-2 mb-4">Statuses</h1>
    <p-table [value]="statuses" [loading]="loading" styleClass="p-datatable-striped">
      <ng-template pTemplate="header">
        <tr>
          <th>Status Code</th>
          <th>Description</th>
          <th>Domain Count</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-status>
        <tr>
          <td><a [routerLink]="['/assets/statuses', status.eppCode]" class="text-primary">{{ status.eppCode }}</a></td>
          <td>{{ status.description }}</td>
          <td>{{ status.domainCount }}</td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export default class StatusesIndexPageComponent implements OnInit {
  statuses: { eppCode: string; description: string; domainCount: number }[] = [];
  loading: boolean = true;

  constructor(
    private databaseService: DatabaseService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadStatuses();
  }

  loadStatuses() {
    this.loading = true;
    this.databaseService.getStatusesWithDomainCounts().subscribe({
      next: (statusesWithCounts) => {
        this.statuses = statusesWithCounts.sort((a, b) => b.domainCount - a.domainCount);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching statuses:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load statuses'
        });
        this.loading = false;
      }
    });
  }
}
