import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomainCardComponent } from '../../../components/domain-card/domain-card.component';
import { PrimeNgModule } from '../../../prime-ng.module';
import DatabaseService from '../../../services/database.service';
import { DbDomain } from '../../../../types/Database';
import { FieldVisibilityFilterComponent, type FieldOption } from '../../../components/domain-filters/domain-filters.component';

@Component({
  standalone: true,
  selector: 'domain-all-page',
  imports: [DomainCardComponent, PrimeNgModule, CommonModule, FieldVisibilityFilterComponent],
  template: `
    <div class="mb-4">
      <app-field-visibility-filter (visibilityChange)="onVisibilityChange($event)"></app-field-visibility-filter>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <app-domain-card
        *ngFor="let domain of domains"
        [domain]="domain"
        [visibleFields]="visibleFields"
      ></app-domain-card>
    </div>
  `,
})
export default class DomainAllPageComponent implements OnInit {
  domains: DbDomain[] = [];
  loading: boolean = true;
  visibleFields: FieldOption[] = [];

  constructor(private databaseService: DatabaseService) {}

  ngOnInit() {
    this.loadDomains();
  }

  loadDomains() {
    this.loading = true;
    this.databaseService.listDomains().subscribe({
      next: (domains) => {
        this.domains = domains;
        this.loading = false;
        console.log(domains);
      },
      error: (error) => {
        console.error('Error fetching domains:', error);
        this.loading = false;
      }
    });
  }

  onVisibilityChange(selectedFields: FieldOption[]) {
    this.visibleFields = selectedFields;
  }
}
