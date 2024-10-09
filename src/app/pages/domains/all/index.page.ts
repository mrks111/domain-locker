import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Fuse from 'fuse.js';
import { DomainCardComponent } from '../../../components/domain-card/domain-card.component';
import { DomainListComponent } from '../../../components/domain-list/domain-list.component';
import { PrimeNgModule } from '../../../prime-ng.module';
import DatabaseService from '../../../services/database.service';
import { DbDomain } from '../../../../types/Database';
import { FieldVisibilityFilterComponent, type FieldOption } from '../../../components/domain-filters/domain-filters.component';
import { MessageService } from 'primeng/api';

@Component({
  standalone: true,
  selector: 'domain-all-page',
  imports: [DomainCardComponent, DomainListComponent, PrimeNgModule, CommonModule, FieldVisibilityFilterComponent],
  templateUrl: './index.page.html',
})
export default class DomainAllPageComponent implements OnInit {
  domains: DbDomain[] = [];
  filteredDomains: DbDomain[] = [];
  loading: boolean = true;
  isGridLayout: boolean = true;
  visibleFields: FieldOption[] = [];
  searchTerm: string = '';
  private fuse!: Fuse<DbDomain>;

  constructor(private databaseService: DatabaseService, private messageService: MessageService,) {}

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

  onVisibilityChange(selectedFields: FieldOption[]) {
    this.visibleFields = selectedFields;
  }

  onSearchChange(searchTerm: string) {
    this.searchTerm = searchTerm.toLowerCase();
    this.filterDomains();
  }

  onLayoutChange(isGrid: boolean) {
    this.isGridLayout = isGrid;
  }

  initializeFuse() {
    const options = {
      keys: ['domain_name', 'registrar.name', 'tags', 'notes', 'ip_addresses.ip_address'],
      threshold: 0.3
    };
    this.fuse = new Fuse(this.domains, options);
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
