import { Component, OnInit } from '@angular/core';
import DatabaseService from '../../services/database.service';
import { DbDomain } from '../../../types/Database';
import { PrimeNgModule } from '../../prime-ng.module';
import { NgFor, NgSwitch, NgSwitchCase, DatePipe, CommonModule } from '@angular/common';
import { DomainUtils } from '../../services/domain-utils.service';

@Component({
  standalone: true,
  selector: 'app-domain-list',
  templateUrl: './domain-list.component.html',
  styleUrls: ['./domain-list.component.scss'],
  imports: [PrimeNgModule, NgFor, NgSwitch, NgSwitchCase, DatePipe, CommonModule]
})
export class DomainListComponent implements OnInit {
  domains: DbDomain[] = [];
  loading: boolean = true;

  // Full list of columns
  columns = [
    { field: 'domain_name', header: 'Domain', frozen: true },
    { field: 'registrar', header: 'Registrar' },
    { field: 'expiry_date', header: 'Expiry' },
    { field: 'tags', header: 'Tags' },
    { field: 'notes', header: 'Notes' },
    { field: 'status', header: 'Status', visible: false },
    { field: 'ipAddresses', header: 'IP Addresses', visible: false },
    { field: 'ssl', header: 'SSL', visible: false }
  ];

  // Only visible columns by default
  visibleColumns = [
    { field: 'domain_name', header: 'Domain', frozen: true },
    { field: 'registrar', header: 'Registrar' },
    { field: 'expiry_date', header: 'Expiry' }
  ];

  constructor(private databaseService: DatabaseService, public domainUtils: DomainUtils) {}

  ngOnInit() {
    this.loadDomains();
  }

  loadDomains() {
    this.loading = true;
    this.databaseService.listDomains().subscribe(
      (domains) => {
        console.log('Fetched domains:', domains);
        this.domains = domains;
        // this.domains.map((domain) => {
        //   domain.registrar = domain.registrar?.name;
        // });
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching domains:', error);
        this.loading = false;
      }
    );
  }

  toggleColumn(col: any) {
    col.visible = !col.visible;
  }

}
