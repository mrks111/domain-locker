import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Fuse from 'fuse.js';
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
      <app-field-visibility-filter
      (visibilityChange)="onVisibilityChange($event)"
      (searchChange)="onSearchChange($event)"
    />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <app-domain-card
        *ngFor="let domain of filteredDomains || domains"
        [domain]="domain"
        [visibleFields]="visibleFields"
      ></app-domain-card>
    </div>
  `,
})
export default class DomainAllPageComponent implements OnInit {
  domains: DbDomain[] = [];
  filteredDomains: DbDomain[] = [];
  loading: boolean = true;
  visibleFields: FieldOption[] = [];
  searchTerm: string = '';
  private fuse!: Fuse<DbDomain>;

  constructor(private databaseService: DatabaseService) {}

  ngOnInit() {
    this.loadDomains();
    this.initializeFuse();
  }

  loadDomains() {
    this.loading = true;
    this.databaseService.listDomains().subscribe({
      next: (domains) => {
        this.domains = domains;
        this.filteredDomains = domains;
        this.loading = false;
        console.log(domains);
      },
      error: (error) => {
        console.error('Error fetching domains:', error);
        this.loading = false;
      }
    });
  }

  initializeFuse() {
    const options = {
      keys: ['domain_name', 'registrar.name', 'tags', 'notes', 'ip_addresses.ip_address'],
      threshold: 0.3
    };
    this.fuse = new Fuse(this.domains, options);
  }

  onVisibilityChange(selectedFields: FieldOption[]) {
    this.visibleFields = selectedFields;
  }

  onSearchChange(searchTerm: string) {
    this.searchTerm = searchTerm.toLowerCase();
    this.filterDomains();
  }


  filterDomains() {
    if (!this.searchTerm) {
      this.filteredDomains = this.domains;
      return;
    }
    const searchResults = this.fuse.search(this.searchTerm);
    this.filteredDomains = searchResults.map(result => result.item);
    if (this.filteredDomains.length === 0) {
      this.filteredDomains = this.domains.filter(domain => 
        this.domainMatchesSearch(domain, this.searchTerm.toLowerCase())
      );
    }
  }

  domainMatchesSearch(domain: DbDomain, searchTerm: string): boolean {
    return domain.domain_name.toLowerCase().includes(searchTerm) ||
      domain.registrar?.name.toLowerCase().includes(searchTerm) ||
      domain.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      domain.notes?.toLowerCase().includes(searchTerm) ||
      domain.ip_addresses?.some(ip => ip.ip_address.includes(searchTerm)) ||
      false;
  }
}
