import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomainCardComponent } from '../../../components/domain-card/domain-card.component';
import { PrimeNgModule } from '../../../prime-ng.module';
import DatabaseService from '../../../services/database.service';
import { DbDomain } from '../../../../types/Database';

@Component({
  standalone: true,
  selector: 'domain-all-page',
  imports: [DomainCardComponent, PrimeNgModule, CommonModule],
  templateUrl: './index.page.html',
})
export default class DomainAllPageComponent implements OnInit {
  domains: DbDomain[] = [];
  loading: boolean = true;

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
}
