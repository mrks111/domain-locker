import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PrimeNgModule } from '@/app/prime-ng.module';
import DatabaseService from '@/app/services/database.service';
import { SubdomainListComponent } from './subdomain-list.component';
import { ErrorHandlerService } from '@/app/services/error-handler.service';

@Component({
  standalone: true,
  selector: 'app-subdomains-index',
  imports: [CommonModule, RouterModule, PrimeNgModule, SubdomainListComponent],
  templateUrl: './subdomains.page.html',
})
export default class SubdomainsIndexPageComponent implements OnInit {
  subdomains: { domain: string; subdomains: any[] }[] = [];
  loading: boolean = true;

  constructor(
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit() {
    this.loadSubdomains();
  }

  loadSubdomains() {
    this.loading = true;
    this.databaseService.subdomainsQueries.getAllSubdomains().subscribe({
      next: (subdomains) => {
        this.subdomains = this.databaseService.subdomainsQueries.groupSubdomains(subdomains);
        console.log('Subdomains:', this.subdomains);
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.handleError({ error });
        this.loading = false;
      },
    });
  }
}
